# Intelliceed PatientApp Mobile v2 Architecture

## System Architecture Overview

```mermaid
flowchart TB
    User[User]

    subgraph UI[UI Layer]
        RootNavigator[RootNavigator]
        PublicStack[PublicStack]
        PrivateDrawer[PrivateDrawer]
        FeatureStacks[Feature Stacks]
        Screens[Screens]
        Components[Shared Components]
        Hooks[Custom Hooks]
    end

    subgraph State[State Layer]
        Store[Redux Toolkit Store]
        Slices[Slices]
        RTKQ[RTK Query APIs]
        Selectors[Selectors]
    end

    subgraph Domain[Domain and Service Layer]
        Services[Services]
        Mappers[Mappers and Utils]
        Validation[Validation and Types]
    end

    subgraph Native[Native and Platform]
        Permissions[Permissions]
        Biometrics[Biometrics]
        HealthKitFit[Apple Health and Google Fit]
        Media[Camera, Audio, Files]
        Push[Push Notifications]
    end

    subgraph Observability[Cross-Cutting]
        Sentry[Sentry]
        Toasts[Toast and Alert Messaging]
        Config[Environment Config]
    end

    subgraph External[External Systems]
        Backend[Backend APIs]
        Firebase[Firebase Messaging]
        ThirdParty[3rd Party SDKs]
    end

    User --> RootNavigator
    RootNavigator --> PublicStack
    RootNavigator --> PrivateDrawer
    PrivateDrawer --> FeatureStacks
    FeatureStacks --> Screens
    Screens --> Components
    Screens --> Hooks

    Screens --> Selectors
    Hooks --> Store
    Selectors --> Slices
    Store --> RTKQ
    Slices --> Store

    RTKQ --> Services
    Services --> Mappers
    Mappers --> Validation
    Services --> Backend
    Services --> ThirdParty

    Hooks --> Permissions
    Hooks --> Biometrics
    Hooks --> HealthKitFit
    Hooks --> Media
    Services --> Push
    Push --> Firebase

    Store --> Sentry
    Services --> Sentry
    Screens --> Toasts
    Services --> Config
```

## Component Hierarchy (High-Level)

```mermaid
flowchart TB
    App[App.tsx]
    Providers[Global Providers]
    RootNav[RootNavigator]
    Public[Public Stack]
    Private[Private Drawer]

    App --> Providers
    Providers --> RootNav
    RootNav --> Public
    RootNav --> Private

    Private --> Main[Main]
    Private --> DayOverview[Day Overview]
    Private --> Shopping[Shopping]
    Private --> Messenger[Messenger]
    Private --> HealthProfile[Health Profile]
    Private --> Library[Library]
    Private --> MealPreferences[Meal Preferences]
    Private --> CuisineDistribution[Cuisine Distribution]
    Private --> MyResults[My Results]
    Private --> AccountSettings[Account Settings]
    Private --> Info[Info and Terms]

    Main --> SharedUI[Shared UI Components]
    DayOverview --> SharedUI
    Shopping --> SharedUI
    Messenger --> SharedUI
    HealthProfile --> SharedUI
```

## Data Flow (Request and Render)

```mermaid
sequenceDiagram
    participant U as User
    participant S as Screen
    participant H as Hook
    participant Q as RTK Query API
    participant API as Backend API
    participant ST as Redux Store
    participant C as Shared Components
    participant O as Sentry and Toast

    U->>S: Open feature screen
    S->>H: Trigger load action
    H->>Q: Call endpoint or mutation
    Q->>API: HTTP request
    API-->>Q: JSON response
    Q-->>ST: Cache and state update
    ST-->>S: Selector returns normalized data
    S->>C: Render list or details
    C-->>U: Updated UI

    alt Request fails
        Q-->>ST: Rejected state
        S->>O: Show user-friendly error
        O-->>U: Toast or alert
        O-->>O: Capture with Sentry (when relevant)
    end
```

## Current Architectural Notes

- Async orchestration is based on `Redux Toolkit + RTK Query` (no saga runtime).
- Feature logic is organized around `screens`, `hooks`, `store/api`, `store/slices`, and `services`.
- Native integrations are isolated in service and hook layers where possible.

## Update Checklist

- Reflect newly added feature stacks and screens.
- Keep major `RTK Query` API modules and slice groups up to date.
- Note important architecture decisions directly in this file.
