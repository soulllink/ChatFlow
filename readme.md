![ChatFlow preview](./preview.jpg)
# FlowChat

This is a minimalist Ollama chat interface that uses a flowchart to visualize the logic of your input.

The interface is designed to provide a more intuitive way to interact with the chatbot by allowing users to see the flow of their conversation.

Key features include:

* Resending inputs and modify both for LLM and Users.

* Reviewing and editing nodes to merge information and generate different responses.

* The ability to save the graph as JSON and load it to continue your workflow.

* You can compare different models side by side.

## Usage

1. Send empty chat - creates empty nodes
2. Select node - to send request with merged content
3. Connect input and output nodes to merge content and send it no the Ollama
4. Press R and X to resend or delete node
5. Press rope - to delete connection
6. Right click to edit node
7. Double click to zoom into node content

You can test it here: https://soulllink.github.io/ChatFlow/
