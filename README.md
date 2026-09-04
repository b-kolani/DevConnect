# DevConnect
A modern social network for developers that allows them to share their projects, exchange knowledge, and connect with other developers.

# ERD (ENTITY RELATIONSHIP DIAGRAM)

                    DEVCONNECT MVP

                         User
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
      Profile            Post              Project
                          │
                  ┌───────┼────────┐
                  │       │        │
                Image   Comment   Like
                  
User ───────────── Follow ───────────── User

User ───────── Technology ───────── Technology

User ───── ConversationMember ───── Conversation
                                      │
                                      ▼
                                    Message

User ─────────────────────────── Notification