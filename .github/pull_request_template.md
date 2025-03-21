# Pull Request: Server Parameter Handling

## Description
This PR implements the ServerIndicator component that displays the connected server with color coding based on server type.

## Related User Stories/Tasks
- Add server status indicator to UI
- Improve server connection visibility

## Changes Made
- Created ServerIndicator component in the header
- Color coding: green for production and local, blue for custom servers
- Display of hostname and port for clarity
- Updated sprint report with documentation of changes
- Added .gitignore to exclude IDE files

## Testing Performed
- Verified display of server indicator with localhost
- Tested color changes for different server types
- Confirmed port number displays correctly

## Checklist
- [x] Code follows project coding standards
- [x] Documentation has been updated as needed
- [x] All tests pass successfully
- [x] Branch has been rebased on master
- [x] Changes have been reviewed for security implications

## Guild Protocol Acknowledgment
- [x] I have followed the branching strategy defined in the guild documentation
- [x] The sprint report has been updated with details of this feature 