import json
import pytest
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from apps.chat.models import Conversation, ConversationParticipant
from asgiref.sync import sync_to_async
from apps.chat.consumers import ChatConsumer


pytestmark = pytest.mark.asyncio

User = get_user_model()


@pytest.fixture(autouse=True)
def _patch_uuid_json(monkeypatch):
    async def _encode_async(content):
        return json.dumps(content, default=str)

    monkeypatch.setattr(ChatConsumer, "encode_json", staticmethod(_encode_async))


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_ws_echo_basic(settings):
    """
    Happy-path: connect two users to the same conversation and send a message.
    Assumes your consumer puts connections into a room named by conversation.id
    and broadcasts on "chat.message" or similar. We only assert connection + send cycle.
    """
    # Create users + conversation
    u1 = await sync_to_async(User.objects.create_user)(
        email="a@nyu.edu", password="pass", netid="a"
    )
    u2 = await sync_to_async(User.objects.create_user)(
        email="b@nyu.edu", password="pass", netid="b"
    )
    direct_key = Conversation.make_direct_key(u1.id, u2.id)
    conv = await sync_to_async(Conversation.objects.create)(
        created_by=u1, direct_key=direct_key
    )

    await sync_to_async(ConversationParticipant.objects.bulk_create)(
        [
            ConversationParticipant(conversation=conv, user=u1),
            ConversationParticipant(conversation=conv, user=u2),
        ]
    )
    comm1 = WebsocketCommunicator(ChatConsumer.as_asgi(), "/ws/chat/")
    comm1.scope["url_route"] = {"kwargs": {"conversation_id": str(conv.id)}}
    comm1.scope["user"] = u1
    connected1, _ = await comm1.connect()

    comm2 = WebsocketCommunicator(ChatConsumer.as_asgi(), "/ws/chat/")
    comm2.scope["url_route"] = {"kwargs": {"conversation_id": str(conv.id)}}
    comm2.scope["user"] = u2
    connected2, _ = await comm2.connect()

    assert connected1 and connected2

    # Simulate a chat payload (align with your consumer schema)
    await comm1.send_json_to({"type": "message.send", "text": "hello"})
    recv = await comm2.receive_json_from(timeout=3)
    assert "text" in recv or "message" in recv

    await comm1.disconnect()
    await comm2.disconnect()
