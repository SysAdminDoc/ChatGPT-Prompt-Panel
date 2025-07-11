# ChatGPT Prompt Panel

A userscript that adds a highly configurable prompt panel to the ChatGPT interface for enhanced productivity.

## Introduction

ChatGPT Prompt Panel is a browser extension that enhances the ChatGPT user experience by adding a convenient and powerful prompt management system. It was created to streamline workflows, save time, and make interacting with ChatGPT more efficient. The core of the extension is a slidable panel where you can store, manage, and quickly access your favorite prompts.

## Features

### 1\. Prompt Management

  * **What it does**: Allows you to add, edit, delete, and reorder your custom prompts. The panel comes with a set of default prompts to get you started.
  * **How it improves the target interface**: Instead of manually typing or pasting frequently used prompts, you can store them in the panel and inject them into the chat with a single click.
  * **Example usage**:
    ```javascript
    // Default prompts that come with the script
    const DEFAULT_PROMPTS = [
        { name: 'Explain Code', text: 'Explain this code line by line:', autoSend: false },
        { name: 'Refactor Code', text: 'Refactor this code for readability and performance:', autoSend: false }
    ];
    ```

### 2\. Quick Actions

  * **What it does**: The panel includes buttons for "New Chat", "Copy Response", and "Copy Code".
  * **How it improves the target interface**: These buttons provide one-click access to common actions that would otherwise require multiple clicks or manual selection. The "Copy Code" button intelligently finds the last code block in the conversation and copies it.
  * **Example usage**: After generating a response with a code block, click the "Copy Code" button in the panel to copy it to your clipboard.

### 3\. Panel Configuration

  * **What it does**: You can customize the panel's appearance and position. Settings include theme (auto, light, dark) and position (left or right side of the screen).
  * **How it improves the target interface**: This allows you to tailor the panel's look and feel to your preference and integrate it seamlessly with your ChatGPT workspace.
  * **Example usage**: Open the settings modal to switch between a light and dark theme or move the panel to the other side of the screen.

### 4\. Import/Export Prompts

  * **What it does**: You can import and export your prompt library as a JSON file.
  * **How it improves the target interface**: This feature is useful for backing up your prompts or sharing them with others.
  * **Example usage**: Click the "Export" button in the settings to save your prompts to a `chatgpt-prompts.json` file.

## Installation

### Prerequisites

  * A modern web browser that supports userscripts (e.g., Chrome, Firefox, Edge).
  * A userscript manager extension like **Tampermonkey** or **Greasemonkey**.

### Step-by-step instructions

1.  Install a userscript manager (e.g., [Tampermonkey](https://www.tampermonkey.net/)).
2.  Open the `ChatGPT-Prompt-Panel-10.8.user.js` file in your browser or copy its content.
3.  The userscript manager should automatically detect the script and prompt you to install it.
4.  Click "Install" to add the script to your manager.

## Usage

Once installed, navigate to `https://chat.openai.com` or `https://chatgpt.com`. A handle will appear on the side of the screen. Hover over the handle to reveal the prompt panel.

  * **To use a prompt**: Click on any of the prompt buttons in the panel. The prompt text will be inserted into the ChatGPT input box.
  * **To lock the panel**: Click the lock icon in the panel header to keep it open.
  * **To add a new prompt**: Click the "Add New Prompt" button and fill out the form.
  * **To access settings**: Click the gear icon in the panel header.

## Configuration

The extension's settings can be adjusted through the settings modal. All configurations are stored in the userscript manager's storage.

The storage keys used are:

  * `chatgpt_custom_prompts_v2`: Stores the user's custom prompts in JSON format.
  * `chatgpt_panel_theme`: Stores the selected theme ('auto', 'light', or 'dark').
  * `chatgpt_panel_position`: Stores the panel's position ('left' or 'right').
  * `chatgpt_panel_position_top`: Stores the panel's vertical offset.

## Screenshots

*(Screenshots would be placed here in a real repository)*

## Architecture

### File and folder layout

The extension is contained within a single userscript file:

  * **`ChatGPT-Prompt-Panel-10.8.user.js`**: Contains all the HTML, CSS, and JavaScript logic for the extension.
  * **`README.md`**: The file you are currently reading.

### Core modules and their responsibilities

  * **UI Builder**: A set of functions (`createAndAppendPanel`, `buildSettingsModal`, `buildPromptForm`) are responsible for dynamically creating the panel and its components.
  * **State Manager**: The script maintains the application's state using global variables (e.g., `currentPrompts`, `isManuallyLocked`).
  * **GM API Layer**: The script uses Greasemonkey API functions (`GM_addStyle`, `GM_setValue`, `GM_getValue`) to inject CSS and persist user settings.

## API / Function Reference

### `sendPromptToChatGPT(text, autoSend)`

  * **Parameters**:
      * `text` (string): The prompt text to be sent to ChatGPT.
      * `autoSend` (boolean): If `true`, the prompt is automatically submitted.
  * **Return value**: `void`
  * **Purpose**: Injects the prompt text into the ChatGPT input field and optionally submits it.

### `savePrompts()`

  * **Parameters**: None
  * **Return value**: `void`
  * **Purpose**: Saves the current list of prompts to the userscript manager's storage.

### `loadAndDisplayPrompts()`

  * **Parameters**: None
  * **Return value**: `void`
  * **Purpose**: Loads the prompts from storage and renders them in the panel.

## Contributing

### How to report issues

Please create a new issue on the GitHub repository, providing as much detail as possible. Include steps to reproduce the bug and any relevant screenshots.

### How to submit pull requests

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with a descriptive message.
4.  Push your changes to your fork.
5.  Submit a pull request to the main repository.

### Coding style guidelines

This project follows standard JavaScript conventions. Please ensure your code is clean, readable, and well-commented.

## Changelog

### [10.8] - 2025-07-11

  * Initial release of the ChatGPT Prompt Panel.
  * Features include a configurable prompt panel, quick actions, and import/export functionality.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Disclosure

This userscript is not affiliated with, endorsed by, or in any way officially connected with OpenAI or ChatGPT. It is an unofficial third-party extension created to enhance the user experience.
