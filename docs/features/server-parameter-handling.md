# Server Parameter Handling

## Overview
The server parameter handling feature allows developers and users to connect to different server environments by passing a server URL parameter. This document explains how to use this feature and how it's implemented.

## Usage

### Passing Server Parameters
Server parameters can be passed in the following ways:

1. **URL Parameter**:
   ```
   https://yourgame.com/?server=https://api.yourserver.com
   ```

2. **Git Parameter**:
   When launching the game through git, you can pass the server parameter:
   ```
   git launch --server=https://api.yourserver.com
   ```

### Stored Preferences
Once a server parameter is provided, it's stored in localStorage as `selectedServer`. This preference persists between sessions until explicitly cleared.

### Clearing Server Preferences
Server preferences can be cleared in two ways:

1. **Settings UI**:
   Navigate to the game settings and click the "Forgot server preference" button.

2. **Programmatically**:
   ```typescript
   import { clearLocalStorage } from './client/Utils';
   
   // Clear server preferences
   clearLocalStorage();
   ```

## Implementation Details

### Key Components

1. **Utils/index.ts**:
   - `isLocal()`: Determines if the application is running locally
   - `isLocalForColyseus()`: Special check for Colyseus server connections
   - `apiUrl()`: Constructs the appropriate API URL based on environment and preferences
   - `clearLocalStorage()`: Clears stored server preferences

2. **Settings UI**:
   - Includes a "Forgot server preference" button that calls the `clearLocalStorage()` function

### Storage
Server preferences are stored in localStorage with the following keys:
- `selectedServer`: The selected server URL
- `force_production_colyseus`: Flag to force production Colyseus server even in local development

## Development Guidelines

1. **Adding New Parameters**:
   When adding new server-related parameters, update the `clearLocalStorage()` function to include them.

2. **Changing Server Logic**:
   When changing server connection logic, ensure backwards compatibility with existing stored preferences.

3. **Testing**:
   - Test with various URL parameters
   - Test clearing preferences
   - Test fallback to default servers when no preference is available 