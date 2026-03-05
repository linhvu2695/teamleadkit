import aiosqlite
import json
import logging
from typing import Any, Dict, Optional
from pathlib import Path
from app.core.config import settings


TASKS_TABLE_COLUMNS = [
    "identifier", "title", "doc_sub_type", "status",
    "time_spent_mn", "time_left_mn", "assigned_to", "main_dev_team",
    "estimated_completion_date", "cortex_share_link",
    "importance_for_next_release", "dependencies",
    "estimated_start_date", "estimated_end_date", "completion_date",
    "parent_folder_identifier", "monitor", "module", "complexity",
    "created_at", "updated_at",
]

JSON_COLUMNS = {"main_dev_team", "dependencies"}
BOOL_COLUMNS = {"monitor"}


class Database:
    """SQLite-backed database that mirrors the MongoDB interface used by WorkService."""

    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, "_initialized") and self._initialized:
            return
        self.db_path = settings.db_path
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._db: Optional[aiosqlite.Connection] = None
        self._initialized = True

    async def _get_db(self) -> aiosqlite.Connection:
        if self._db is None:
            self._db = await aiosqlite.connect(self.db_path)
            self._db.row_factory = aiosqlite.Row
            await self._init_tables()
        return self._db

    async def _init_tables(self):
        assert self._db is not None
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                identifier TEXT UNIQUE NOT NULL,
                title TEXT DEFAULT '',
                doc_sub_type TEXT DEFAULT '',
                status TEXT DEFAULT '',
                time_spent_mn INTEGER DEFAULT 0,
                time_left_mn INTEGER DEFAULT 0,
                assigned_to TEXT DEFAULT '',
                main_dev_team TEXT DEFAULT '[]',
                estimated_completion_date TEXT,
                cortex_share_link TEXT DEFAULT '',
                importance_for_next_release TEXT DEFAULT '',
                dependencies TEXT DEFAULT '[]',
                estimated_start_date TEXT,
                estimated_end_date TEXT,
                completion_date TEXT,
                parent_folder_identifier TEXT DEFAULT '',
                monitor INTEGER DEFAULT 0,
                module TEXT DEFAULT '',
                complexity REAL,
                created_at TEXT,
                updated_at TEXT
            )
        """)
        await self._db.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_identifier ON tasks(identifier)"
        )
        await self._db.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_folder_identifier)"
        )
        await self._db.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)"
        )
        await self._db.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_monitor ON tasks(monitor)"
        )
        await self._db.commit()

    async def check_health(self):
        try:
            db = await self._get_db()
            await db.execute("SELECT 1")
            logging.getLogger("uvicorn.info").info(
                f"Successfully connected to SQLite at {self.db_path}"
            )
            return True
        except Exception as ex:
            logging.getLogger("uvicorn.error").error(
                f"Failed to connect to SQLite: {ex}"
            )
            return False

    async def close(self):
        if self._db:
            await self._db.close()
            self._db = None
            self._initialized = False

    # -- Row ↔ dict helpers --

    def _row_to_dict(self, row: aiosqlite.Row) -> dict:
        d = dict(row)
        d.pop("id", None)
        for col in JSON_COLUMNS:
            if col in d and isinstance(d[col], str):
                try:
                    d[col] = json.loads(d[col])
                except (json.JSONDecodeError, TypeError):
                    d[col] = []
        for col in BOOL_COLUMNS:
            if col in d:
                d[col] = bool(d[col])
        return d

    def _prepare_for_insert(self, document: dict) -> dict:
        """Prepare a document dict for SQLite insertion."""
        row: dict[str, Any] = {}
        for col in TASKS_TABLE_COLUMNS:
            if col not in document:
                continue
            val = document[col]
            if col in JSON_COLUMNS:
                val = json.dumps(val) if not isinstance(val, str) else val
            elif col in BOOL_COLUMNS:
                val = int(bool(val))
            elif val is not None and not isinstance(val, (int, float, str)):
                val = str(val)
            row[col] = val
        return row

    # -- Public query methods (matching MongoDB interface) --

    async def find_documents_by_field(
        self, collection_name: str, field_name: str, field_value: Any
    ) -> list[dict]:
        db = await self._get_db()
        if field_name in BOOL_COLUMNS:
            field_value = int(bool(field_value))
        sql = f"SELECT * FROM {collection_name} WHERE {field_name} = ?"
        cursor = await db.execute(sql, (field_value,))
        rows = await cursor.fetchall()
        return [self._row_to_dict(r) for r in rows]

    async def find_documents_with_filters(
        self,
        collection_name: str,
        filters: Dict[str, Any],
        skip: int = 0,
        limit: Optional[int] = None,
        sort_by: Optional[str] = None,
        asc: bool = True,
        collation: Optional[Dict[str, Any]] = None,
    ) -> list[dict]:
        """
        Translate MongoDB-style filters to SQL WHERE clauses.
        Supports: plain equality, $in, $gte, $lte operators.
        If collation has strength=2, uses COLLATE NOCASE.
        """
        db = await self._get_db()
        conditions: list[str] = []
        params: list[Any] = []
        nocase = (
            collation is not None and collation.get("strength") == 2
        )

        for field, value in filters.items():
            col = field
            if isinstance(value, dict):
                if "$in" in value:
                    placeholders = ",".join("?" for _ in value["$in"])
                    if nocase:
                        conditions.append(
                            f"{col} COLLATE NOCASE IN ({placeholders})"
                        )
                    else:
                        conditions.append(f"{col} IN ({placeholders})")
                    params.extend(
                        str(v) if not isinstance(v, (int, float)) else v
                        for v in value["$in"]
                    )
                if "$gte" in value:
                    conditions.append(f"{col} >= ?")
                    v = value["$gte"]
                    params.append(str(v) if not isinstance(v, (int, float)) else v)
                if "$lte" in value:
                    conditions.append(f"{col} <= ?")
                    v = value["$lte"]
                    params.append(str(v) if not isinstance(v, (int, float)) else v)
            else:
                if col in BOOL_COLUMNS:
                    value = int(bool(value))
                if nocase:
                    conditions.append(f"{col} COLLATE NOCASE = ?")
                else:
                    conditions.append(f"{col} = ?")
                params.append(value)

        where = " AND ".join(conditions) if conditions else "1=1"
        sql = f"SELECT * FROM {collection_name} WHERE {where}"

        if sort_by:
            direction = "ASC" if asc else "DESC"
            sql += f" ORDER BY {sort_by} {direction}"
        if skip > 0:
            sql += f" OFFSET {skip}"
        if limit:
            sql += f" LIMIT {limit}"

        cursor = await db.execute(sql, params)
        rows = await cursor.fetchall()
        return [self._row_to_dict(r) for r in rows]

    async def insert_document(self, collection_name: str, document: dict) -> str:
        db = await self._get_db()
        row = self._prepare_for_insert(document)
        columns = ", ".join(row.keys())
        placeholders = ", ".join("?" for _ in row)
        sql = f"INSERT INTO {collection_name} ({columns}) VALUES ({placeholders})"
        cursor = await db.execute(sql, list(row.values()))
        await db.commit()
        return str(cursor.lastrowid)

    async def update_document_by_identifier(
        self, collection_name: str, identifier: str, document: dict
    ) -> bool:
        """Update a document matched by its `identifier` field."""
        db = await self._get_db()
        row = self._prepare_for_insert(document)
        set_clause = ", ".join(f"{k} = ?" for k in row.keys())
        sql = f"UPDATE {collection_name} SET {set_clause} WHERE identifier = ?"
        cursor = await db.execute(sql, [*row.values(), identifier])
        await db.commit()
        return cursor.rowcount > 0
