# Design System Sync

A real-time synchronization system that connects Figma designs with React components, ensuring design consistency and streamlining the design-to-development workflow.

## Note

Working with my frontend colleague, we pitched and prototyped a Figma-to-React sync tool(for our internal use) to bridge the designer-engineer gap, like a Storybook for seamless design-system integration. Moved the minimal functionality to this public repo so you can check it out.

## Live Demo

[View the live demo here](https://drive.google.com/file/d/1zzbYGob4-LgFwiwiEyYIJ2pRco31zKUm/view)

## Overview

Design System Sync creates a bidirectional link between Figma and React:

- **Figma to React:** Automatically generate React components from Figma designs
- **React to Figma:** Push component updates back to Figma
- **Real-time Sync:** Changes in either environment are reflected immediately

## Architecture

The system consists of three main parts:

1. **Figma Plugin**: Communicates with the Figma API to extract design tokens and component structure
2. **WebSocket Server**: Manages communication between Figma and React
3. **React Application**: Renders components and handles updates

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Figma account (for the Figma plugin)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/rubpat5/design-system-sync.git
   cd design-system-sync
   ```

2. Install dependencies for the server:
   ```
   cd server
   npm install
   ```

3. Install dependencies for the React application:
   ```
   cd ../react-app
   npm install
   ```

### Running the Server

1. Start the WebSocket server:
   ```
   cd server
   npm start
   ```
   The server will run on port 3031 by default.

### Running the React Application

1. Start the React development server:
   ```
   cd react-app
   npm run dev
   ```
   The React application will be available at http://localhost:3000 (or another port if 3000 is in use).

### Setting Up the Figma Plugin

Instructions for installing and using the Figma plugin will be provided separately.

## How It Works

1. The WebSocket server establishes connections with both the Figma plugin and the React application
2. When changes are made in Figma, the plugin extracts component data and sends it to the server
3. The server forwards this data to the React application, which renders the updated components
4. Similarly, changes in the React codebase can be sent back to Figma

## Key Features

- **Design Token Synchronization**: Colors, typography, spacing, and other design tokens stay in sync
- **Component Structure Mapping**: Figma layers map to React component hierarchy
- **Properties Preservation**: Component properties and variants are maintained during sync
- **Bidirectional Updates**: Changes flow in both directions
- **Logging and History**: All synchronization events are logged for debugging and reference

## Folder Structure

- `/server`: WebSocket server code
- `/react-app`: React application
- `/figma-plugin`: Figma plugin code (to be added separately)
