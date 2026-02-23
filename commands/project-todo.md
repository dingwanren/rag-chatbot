# RAG Chatbot - Project TODO

> **Last Updated:** 2026-02-23  
> **Project Type:** Personal Full-Stack AI Chatbot Application

---

## 1. Technology Stack Overview

### 1.1 Frontend Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | React framework with App Router |
| **React** | 19.2.3 | UI library |
| **TypeScript** | ^5 | Type-safe development |
| **Tailwind CSS** | ^4 | Utility-first styling |
| **shadcn/ui** | - | UI component library (Radix-based) |
| **Lucide React** | ^0.563.0 | Icon library |
| **Ant Design X** | ^2.2.2 | AI chat UI components |

### 1.2 State Management & Data Fetching
| Technology | Version | Purpose |
|------------|---------|---------|
| **TanStack React Query** | ^5.90.20 | Server state management |
| **Axios** | ^1.13.4 | HTTP client |

### 1.3 AI & LLM Integration
| Technology | Version | Purpose |
|------------|---------|---------|
| **Vercel AI SDK** | ^6.0.57 | AI streaming & chat hooks |
| **@ai-sdk/react** | ^3.0.61 | React bindings for AI SDK |
| **@ai-sdk/deepseek** | ^2.0.12 | DeepSeek LLM provider |
| **LangChain** | ^1.2.15 | LLM orchestration framework |
| **@langchain/core** | ^1.1.17 | LangChain core utilities |
| **@langchain/community** | ^1.1.9 | Community integrations |
| **@langchain/textsplitters** | ^1.0.1 | Document text splitting |

### 1.4 Vector Database
| Technology | Version | Purpose |
|------------|---------|---------|
| **Pinecone** | ^6.1.4 | Vector database for RAG embeddings |

### 1.5 File Processing
| Technology | Version | Purpose |
|------------|---------|---------|
| **pdf-parse** | ^1.1.4 | PDF text extraction |
| **react-dropzone** | ^14.3.8 | File upload drag-and-drop |

### 1.6 Utilities
| Technology | Version | Purpose |
|------------|---------|---------|
| **ts-md5** | ^2.0.1 | Hash generation |
| **clsx + tailwind-merge** | - | Conditional class handling |
| **class-variance-authority** | ^0.7.1 | Component variant utilities |

---

## 2. Project Description

A **web-based AI chatbot application** with RAG (Retrieval-Augmented Generation) capabilities. Users can engage in AI-powered conversations, upload documents to create personal knowledge bases, and chat with their documents using vector search technology.

---

## 3. Feature TODO List

### 3.1 User Authentication System

- [ ] **User Registration**
  - [ ] Create registration form (username, password)
  - [ ] Implement simple credential storage (no email/phone verification)
  - [ ] Add password confirmation validation
  - [ ] Create user database schema/table

- [ ] **User Login**
  - [ ] Create login form
  - [ ] Implement credential verification
  - [ ] Create session/token management
  - [ ] Add logout functionality
  - [ ] Implement protected route guards

- [ ] **User Profile (Basic)**
  - [ ] Display current logged-in user
  - [ ] Allow password change
  - [ ] Show account creation date

---

### 3.2 Chat Conversation System

- [ ] **Basic AI Chat**
  - [ ] Implement chat interface with message display
  - [ ] Connect to DeepSeek LLM via AI SDK
  - [ ] Support streaming responses
  - [ ] Add typing indicator
  - [ ] Handle error states

- [ ] **Conversation Management**
  - [ ] Create new conversation button
  - [ ] List all user conversations (sidebar)
  - [ ] Switch between conversations
  - [ ] Rename conversations
  - [ ] Delete conversations
  - [ ] Auto-save conversation history

- [ ] **Conversation Export**
  - [ ] Export conversation as text file
  - [ ] Export conversation as JSON
  - [ ] Export conversation as PDF (optional)

- [ ] **Conversation History**
  - [ ] Persist conversations to database
  - [ ] Load conversation history on login
  - [ ] Implement conversation search/filter
  - [ ] Add conversation pagination (if needed)

---

### 3.3 RAG (Retrieval-Augmented Generation) Mode

- [ ] **RAG Toggle**
  - [ ] Add RAG mode switch in chat interface
  - [ ] Visual indicator for RAG vs normal mode
  - [ ] Knowledge base selector dropdown

- [ ] **Knowledge Base Selection**
  - [ ] Display available knowledge bases
  - [ ] Allow selecting single/multiple knowledge bases
  - [ ] Show knowledge base info (file count, etc.)

- [ ] **RAG Chat Flow**
  - [ ] Implement vector search on user query
  - [ ] Retrieve relevant document chunks
  - [ ] Inject context into LLM prompt
  - [ ] Display source citations in responses

---

### 3.4 Knowledge Base Management

- [ ] **Knowledge Base CRUD**
  - [ ] Create new knowledge base
  - [ ] Name and description fields
  - [ ] List all user knowledge bases
  - [ ] Edit knowledge base details
  - [ ] Delete knowledge base (with confirmation)

- [ ] **File Management (per Knowledge Base)**
  - [ ] Upload files (PDF, TXT, MD, etc.)
  - [ ] Drag-and-drop upload interface
  - [ ] Show uploaded files list
  - [ ] Display file status (processing, ready, error)
  - [ ] Delete files from knowledge base
  - [ ] Re-process files if needed

- [ ] **File Processing Pipeline**
  - [ ] Extract text from uploaded files
  - [ ] Split text into chunks (LangChain text splitters)
  - [ ] Generate embeddings for chunks
  - [ ] Store embeddings in Pinecone
  - [ ] Track processing status

---

### 3.5 Backend API Routes

- [ ] **Authentication APIs**
  - [ ] `POST /api/auth/register` - User registration
  - [ ] `POST /api/auth/login` - User login
  - [ ] `POST /api/auth/logout` - User logout
  - [ ] `GET /api/auth/me` - Get current user

- [ ] **Conversation APIs**
  - [ ] `GET /api/conversations` - List conversations
  - [ ] `POST /api/conversations` - Create conversation
  - [ ] `GET /api/conversations/[id]` - Get conversation
  - [ ] `PUT /api/conversations/[id]` - Update conversation
  - [ ] `DELETE /api/conversations/[id]` - Delete conversation
  - [ ] `POST /api/chat` - Send chat message

- [ ] **Knowledge Base APIs**
  - [ ] `GET /api/knowledge-bases` - List knowledge bases
  - [ ] `POST /api/knowledge-bases` - Create knowledge base
  - [ ] `GET /api/knowledge-bases/[id]` - Get knowledge base
  - [ ] `PUT /api/knowledge-bases/[id]` - Update knowledge base
  - [ ] `DELETE /api/knowledge-bases/[id]` - Delete knowledge base

- [ ] **File Management APIs**
  - [ ] `POST /api/files/upload` - Upload file
  - [ ] `GET /api/knowledge-bases/[id]/files` - List files
  - [ ] `DELETE /api/files/[id]` - Delete file
  - [ ] `POST /api/files/[id]/process` - Process file for RAG

- [ ] **Chat APIs**
  - [ ] `POST /api/chat` - Standard chat endpoint
  - [ ] `POST /api/chat/rag` - RAG chat endpoint with vector search

---

### 3.6 Database Schema (To Design)

- [ ] **Users Table**
  - [ ] id, username, password (hashed), createdAt

- [ ] **Conversations Table**
  - [ ] id, userId, title, messages (JSON), createdAt, updatedAt

- [ ] **KnowledgeBases Table**
  - [ ] id, userId, name, description, createdAt

- [ ] **Files Table**
  - [ ] id, knowledgeBaseId, filename, filepath, status, processedAt

---

### 3.7 UI/UX Pages

- [ ] **Auth Pages**
  - [ ] `/login` - Login page
  - [ ] `/register` - Registration page

- [ ] **Main App Pages**
  - [ ] `/` - Main chat interface (redirect to chat or home)
  - [ ] `/chat` - Active chat view
  - [ ] `/conversations` - Conversation management
  - [ ] `/knowledge-bases` - Knowledge base list
  - [ ] `/knowledge-bases/[id]` - Single knowledge base detail with files

- [ ] **Layout Components**
  - [ ] Sidebar navigation
  - [ ] Header with user info
  - [ ] Responsive mobile layout

---

### 3.8 Infrastructure & Configuration

- [ ] **Environment Variables**
  - [ ] Database connection string
  - [ ] Pinecone API key & environment
  - [ ] DeepSeek API key
  - [ ] File storage configuration

- [ ] **Database Setup**
  - [ ] Choose database (PostgreSQL/MySQL/SQLite for simplicity)
  - [ ] Set up ORM (Prisma/Drizzle) or raw queries
  - [ ] Create migration scripts

- [ ] **File Storage**
  - [ ] Configure local storage or cloud storage
  - [ ] Set upload size limits
  - [ ] Implement file cleanup on deletion

---

## 4. Implementation Priority

### Phase 1: Core Foundation
1. Database setup & schema
2. User authentication (register/login)
3. Basic chat interface with AI

### Phase 2: Conversation Features
4. Conversation CRUD operations
5. Conversation history & persistence
6. Export functionality

### Phase 3: RAG Capabilities
7. Knowledge base CRUD
8. File upload & processing pipeline
9. Vector search integration
10. RAG chat mode

### Phase 4: Polish & Enhancement
11. UI/UX improvements
12. Error handling & edge cases
13. Performance optimization

---

## 5. Notes & Considerations

- **Security**: Implement password hashing (bcrypt/argon2)
- **Scalability**: Consider pagination for large conversation/file lists
- **File Limits**: Set reasonable upload size limits
- **Rate Limiting**: Add rate limiting for chat endpoints
- **Error Handling**: Graceful error messages for failed operations

---

## 6. Future Enhancements (Out of Scope for MVP)

- [ ] Email/phone verification for accounts
- [ ] OAuth login (Google, GitHub)
- [ ] Multi-format export (Markdown, HTML)
- [ ] Share conversations publicly
- [ ] Collaborative knowledge bases
- [ ] Advanced file types (DOCX, PPTX, images with OCR)
- [ ] Voice input/output
- [ ] Mobile app version
