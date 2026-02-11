from typing import Optional

from fastapi import APIRouter, Query

from backend.app.api.mock_data import ORGANIZATIONS
from backend.app.schemas import Organization, SubscriptionStatus

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("", response_model=list[Organization])
def list_organizations(
    subscription_status: Optional[SubscriptionStatus] = Query(
        default=None,
        alias="subscriptionStatus",
    ),
) -> list[Organization]:
    if subscription_status is None:
        return ORGANIZATIONS

    return [
        organization
        for organization in ORGANIZATIONS
        if organization.subscription_status == subscription_status
    ]
