# Directus Chat Assistant Extension
## Overview
Directus Assistant revolutionizes the way you manage your CMS, harnessing the power of OpenAI's GPT-4 to expand beyond traditional capabilities. This innovative tool empowers users with the ability to execute complex functions seamlessly, even those not natively supported by the CMS.

Imagine effortlessly instructing the Assistant to identify and merge duplicate items, and then to remove any redundancies – tasks that typically require intricate manual processes or advanced programming skills. With Directus Assistant, these actions are simplified into intuitive commands, making CMS management more efficient and user-friendly.

By leveraging the cutting-edge AI of GPT-4, Directus Assistant not only enhances your productivity but also unlocks new possibilities for content management, offering a glimpse into the future of AI-assisted digital administration.

## Features
* **ItemsService:** The main functionalities of ItemsService have been mapped to be able to manage the content of the collections.

## Screenshots
- Chat Assistant Interface: 
![Chat Assistant Interface](/screenshots/assistant_1.jpg)
- Collection Items List: 
![ Collection Items List](/screenshots/list_of_cars.jpg)
- Execution Logs: 
![ Collection Items List](/screenshots/tools_call.jpg)

## Setup and Configuration
### As package npm setup
See this "how to" provided by Directus:
https://docs.directus.io/extensions/installing-extensions.html#installing-through-npm

Package name: directus-extension-assistant

### Local setup
To get started with this extension, follow the steps below:

1. Clone the Repository:
```sh
git clone https://github.com/bernatvadell/directus-assistant.git
cd directus-assistant/
```
2. Create .env File:
This project requires an API key from OpenAI. Create a .env file in the root directory and add your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Install Dependencies & Build:
```sh
pnpm install
pnpm dev
```

4. Running Directus:
After setting up the environment and dependencies, you can start the Directus:

```sh
docker compose up
```

## Usage
Once the extension is up and running, you can interact with the Chat Assistant through the Directus UI. Just type in your queries like you would in a normal conversation, and the assistant will fetch the relevant data from your Directus collections.

## Disclaimer
### Response Accuracy
While this Directus Chat Assistant Extension leverages the advanced capabilities of OpenAI's GPT-4-1106-preview model, it's important to note that the accuracy of responses may vary. The assistant strives to provide relevant and contextually appropriate information based on the input queries and the underlying data schema. However, users should be aware that the responses might not always be entirely precise or exhaustive, and should verify critical information independently.

### Token Consumption
The integration of GPT-4-1106-preview model in this extension involves significant token consumption, primarily due to the comprehensive nature of data schema analysis and query processing. Users should be mindful of the potentially high usage of OpenAI tokens, which could lead to elevated API costs. It's recommended to monitor the token usage regularly and consider optimizing queries for efficiency.

By using this extension, you acknowledge and agree to these limitations and conditions.