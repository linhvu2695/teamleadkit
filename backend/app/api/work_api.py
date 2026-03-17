from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query

from app.classes.work.status import COMPLETE_STATUSES
from app.classes.work.type import TaskType
from app.classes.work.work import SetMonitorRequest
from app.services.work.work_service import WorkService

router = APIRouter()

LINK_AUTH_TOKEN_HEADER = "X-Link-Auth-Token"


def get_link_auth_token(
    x_link_auth_token: str | None = Header(default=None, alias=LINK_AUTH_TOKEN_HEADER),
) -> str | None:
    """Extract the Link API auth token from the request header."""
    return x_link_auth_token


@router.get("/complete-statuses")
async def get_complete_statuses():
    """Get the list of task statuses that count as 'completed' for burn charts and similar views."""
    return [s.value for s in COMPLETE_STATUSES]


@router.get("/task/{task_id}")
async def get_task_detail(
    task_id: str,
    force_refresh: bool = False,
    token: str | None = Depends(get_link_auth_token),
):
    """Get the latest detail for a task by its ID."""
    result = await WorkService().get_task_detail(
        task_id, force_refresh=force_refresh, link_auth_token=token
    )
    if result is None:
        raise HTTPException(status_code=404, detail=f"Cannot get task detail for {task_id}")
    return result


@router.get("/task/{task_id}/descendants")
async def get_descendants_tasks(
    task_id: str,
    force_refresh: bool = False,
    token: str | None = Depends(get_link_auth_token),
):
    """Get all descendant tasks of a task by its ID (recursive tree traversal)."""
    results = await WorkService().get_descendants_tasks(
        task_id, force_refresh=force_refresh, link_auth_token=token
    )
    return results


@router.get("/monitored")
async def get_monitored_tasks():
    """Get all monitored tasks with their descendants."""
    return await WorkService().get_monitored_tasks()


@router.put("/task/{task_id}/monitor")
async def set_task_monitor(task_id: str, body: SetMonitorRequest):
    """Set the monitor flag on a task."""
    success = await WorkService().set_task_monitor(task_id, body.monitor)
    if not success:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return {"ok": True}


@router.get("/assignee/{assignee}/incomplete")
async def get_incomplete_tasks_for_assignee(
    assignee: str,
    subtypes: list[TaskType] = Query(default=[]),
    force_refresh: bool = False,
    token: str | None = Depends(get_link_auth_token),
):
    """Get all incomplete tasks assigned to a given person, optionally filtered by task subtypes."""
    results = await WorkService().get_incomplete_tasks_assigned_to(
        assignee,
        subtypes=subtypes,
        force_refresh=force_refresh,
        link_auth_token=token,
    )
    if results is None:
        return []
    return results


@router.get("/assignee/{assignee}/emergency-stream")
async def get_emergency_stream(
    assignee: str, token: str | None = Depends(get_link_auth_token)
):
    """Get the emergency stream for an assignee (DocSubType:Stream, Title: \"{assignee} Emergency\"). Returns 404 if not found or not unique."""
    result = await WorkService().get_emergency_stream(assignee, link_auth_token=token)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Emergency stream not found for assignee {assignee}")
    return result


@router.get("/assignee/{assignee}/emergency-incomplete")
async def get_emergency_incomplete_tasks(
    assignee: str, token: str | None = Depends(get_link_auth_token)
):
    """Get incomplete tasks in the assignee's emergency stream. Returns 404 if the emergency stream is not found."""
    results = await WorkService().get_emergency_incomplete_tasks(
        assignee, link_auth_token=token
    )
    if results is None:
        raise HTTPException(status_code=404, detail=f"Emergency stream not found for assignee {assignee}")
    return results


@router.get("/assignee/{assignee}/completed")
async def get_completed_tasks_for_assignee(
    assignee: str,
    subtypes: list[TaskType] = Query(default=[]),
    start_date: date | None = Query(default=None, description="Filter by completion date (inclusive)"),
    end_date: date | None = Query(default=None, description="Filter by completion date (inclusive)"),
    force_refresh: bool = False,
    token: str | None = Depends(get_link_auth_token),
):
    """Get completed tasks assigned to a given person, optionally filtered by subtypes and completion date range."""
    tz = timezone.utc
    start_dt = datetime.combine(start_date, time.min, tzinfo=tz) if start_date else None
    end_dt = datetime.combine(end_date, time.max, tzinfo=tz) if end_date else None
    results = await WorkService().get_completed_tasks_assigned_to(
        assignee,
        subtypes=subtypes,
        start_date=start_dt,
        end_date=end_dt,
        force_refresh=force_refresh,
        link_auth_token=token,
    )
    return results or []


@router.get("/team/emergency")
async def get_team_emergency(token: str | None = Depends(get_link_auth_token)):
    """Get emergency incomplete tasks for all team members. Members without a stream are omitted."""
    return await WorkService().get_team_emergency(link_auth_token=token)


@router.get("/team/workload")
async def get_team_workload(
    subtypes: list[TaskType] = Query(default=[]),
    force_refresh: bool = False,
    token: str | None = Depends(get_link_auth_token),
):
    """Get workload summary for all team members, optionally filtered by task subtypes."""
    return await WorkService().get_team_workload(
        subtypes=subtypes, force_refresh=force_refresh, link_auth_token=token
    )


@router.get("/team/completed-workload")
async def get_team_completed_workload(
    start_date: date | None = Query(default=None, description="Start of completion date range (inclusive)"),
    end_date: date | None = Query(default=None, description="End of completion date range (inclusive)"),
    subtypes: list[TaskType] = Query(default=[]),
    force_refresh: bool = False,
    token: str | None = Depends(get_link_auth_token),
):
    """Get completed task counts per team member within a date range."""
    tz = timezone.utc
    start_dt = datetime.combine(start_date, time.min, tzinfo=tz) if start_date else None
    end_dt = datetime.combine(end_date, time.max, tzinfo=tz) if end_date else None
    return await WorkService().get_team_completed_workload(
        start_date=start_dt,
        end_date=end_dt,
        subtypes=subtypes,
        force_refresh=force_refresh,
        link_auth_token=token,
    )
