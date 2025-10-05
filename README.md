# Repo Cleaner

Repo Cleaner is a React web app for managing and cleaning up your GitHub repositories with a modern, clean UI. It supports both dark and light themes.

## Features

- Login with GitHub username and personal access token (stored locally)
- Fetch and display all user repositories with pagination
- View repository name, description, forks, and stars
- Delete repositories with confirmation (using GitHub API)
- Toggle between dark and light mode

## Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- GitHub account and personal access token

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/IndrajeethY/repo-cleaner.git
   cd repo-cleaner
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

## Configuration

1. **Generate a GitHub Personal Access Token:**
   - Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Generate a token with `repo` scope.

2. **Start the app:**
   ```bash
   npm start
   # or
   yarn start
   ```

## Usage

1. On first launch, enter your GitHub username and personal access token.
2. Browse your repositories in a paginated, clean UI.
3. View details: name, description, forks, stars.
4. To delete a repository, click the delete button and confirm.
5. Switch between dark and light mode using the theme toggle.

## Technologies Used

- React
- GitHub REST API
- Styled Components / CSS Modules (for theming)
- Local Storage (for credentials)

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/foo`)
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License
