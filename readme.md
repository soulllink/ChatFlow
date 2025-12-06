# FlowChat

![ChatFlow preview](./preview.jpg)

This is a minimalist Ollama chat interface that uses a flowchart to visualize the logic of your input. The interface is designed to provide a more intuitive way to interact with the chatbot by allowing users to see the flow of their conversation.

## Key Features

- **Visual Conversation Flow**: Understand the logic of your conversation with a flowchart visualization.
- **Node Manipulation**: Resend inputs, modify both LLM and user nodes, and edit nodes to merge information and generate different responses.
- **Save and Load**: Save your conversation graph as a JSON file and load it later to continue your workflow.
- **Model Comparison**: Compare different models side by side.

## Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/soulllink/ChatFlow.git
   ```
2. **Navigate to the project directory**:
   ```bash
   cd ChatFlow
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```
5. **Open the application in your browser**:
   Navigate to `http://localhost:3000` in your web browser.

## Usage

1. **Send an empty chat**: Creates empty nodes.
2. **Select a node**: To send a request with merged content.
3. **Connect nodes**: Connect input and output nodes to merge content and send it to Ollama.
4. **Resend or delete a node**: Press `R` to resend a node's content or `X` to delete a node.
5. **Delete a connection**: Click on a connection to delete it.
6. **Edit a node**: Right-click on a node to edit its content.
7. **Zoom into a node**: Double-click on a node to zoom into its content.

You can test it here: https://soulllink.github.io/ChatFlow/
