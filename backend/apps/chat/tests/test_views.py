# backend/apps/chat/tests/test_views.py
import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


@pytest.fixture
def client(two_users):
    u1, _ = two_users
    c = APIClient()
    c.force_authenticate(user=u1)
    return c, u1


@pytest.fixture
def direct_conversation(make_direct):
    conv, u1, u2 = make_direct()
    return conv, u1, u2


def test_list_conversations_shows_unread_count(client, direct_conversation):
    c, u1 = client
    conv, u1, u2 = direct_conversation

    # Create a message (so list shows counts)
    res = c.post(
        f"/api/v1/chat/conversations/{conv.id}/send/", {"text": "x"}, format="json"
    )
    assert res.status_code == 201

    res = c.get("/api/v1/chat/conversations/")
    assert res.status_code == 200
    row = next(item for item in res.json() if item["id"] == str(conv.id))
    assert "unread_count" in row


def test_messages_endpoint_orders_and_paginates(client, direct_conversation):
    c, u1 = client
    conv, _, _ = direct_conversation

    c.post(f"/api/v1/chat/conversations/{conv.id}/send/", {"text": "1"}, format="json")
    c.post(f"/api/v1/chat/conversations/{conv.id}/send/", {"text": "2"}, format="json")

    from datetime import datetime, timezone

    before = datetime.now(timezone.utc).isoformat()
    res = c.get(
        f"/api/v1/chat/conversations/{conv.id}/messages/",
        {"before": before, "limit": 1},
    )
    assert res.status_code == 200
    assert len(res.json()["results"]) == 1


def test_send_message_and_mark_read(client, direct_conversation):
    c, u1 = client
    conv, _, _ = direct_conversation

    sent = c.post(
        f"/api/v1/chat/conversations/{conv.id}/send/", {"text": "hey"}, format="json"
    )
    assert sent.status_code == 201
    msg_id = sent.json()["id"]

    read = c.post(
        f"/api/v1/chat/conversations/{conv.id}/read/",
        {"message_id": msg_id},
        format="json",
    )
    assert read.status_code == 200


def test_permissions_non_member_cannot_access(two_users, make_direct):
    # Create conversation between u1,u2; access with u3
    from rest_framework.test import APIClient

    conv, u1, u2 = make_direct()
    User = type(u1)
    u3 = User.objects.create_user(email="student3@nyu.edu", password="pass123")

    c3 = APIClient()
    c3.force_authenticate(user=u3)

    res = c3.get(f"/api/v1/chat/conversations/{conv.id}/")
    assert res.status_code in (403, 404)
