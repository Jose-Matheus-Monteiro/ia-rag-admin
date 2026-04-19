from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt

from core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

_HASHED_PASSWORD = bcrypt.hashpw(settings.admin_password.encode(), bcrypt.gensalt())


@router.post("/token")
def login(form: OAuth2PasswordRequestForm = Depends()):
    valid = (
        form.username == settings.admin_user
        and bcrypt.checkpw(form.password.encode(), _HASHED_PASSWORD)
    )
    if not valid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciais inválidas.")
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    token = jwt.encode({"sub": form.username, "exp": expire}, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return {"access_token": token, "token_type": "bearer"}
