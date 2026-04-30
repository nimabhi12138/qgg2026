from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import UserAccount
from .security import decode_access_token

security = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    user_id: int
    username: str
    role: str
    tenant_id: int
    agent_id: int | None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> CurrentUser:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未登录")
    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token 无效") from exc
    username = payload.get("sub")
    role = payload.get("role")
    if not username or not role:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token 无效")
    user = db.query(UserAccount).filter(UserAccount.username == username, UserAccount.status == True).first()  # noqa: E712
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在或禁用")
    return CurrentUser(
        user_id=user.id,
        username=user.username,
        role=user.role,
        tenant_id=user.tenant_id,
        agent_id=user.agent_id,
    )


def require_roles(*allowed_roles: str):
    def checker(current: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")
        return current

    return checker

