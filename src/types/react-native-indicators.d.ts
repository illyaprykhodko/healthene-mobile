declare module 'react-native-indicators' {
  import React from 'react';
  import { ViewStyle } from 'react-native';
  interface IndicatorProps {
    color?: string;
    count?: number;
    size?: number;
    style?: ViewStyle;
    interaction?: boolean;
  }

  export class SkypeIndicator extends React.Component<IndicatorProps> {}
  export class BallIndicator extends React.Component<IndicatorProps> {}
  export class BarIndicator extends React.Component<IndicatorProps> {}
  export class DotIndicator extends React.Component<IndicatorProps> {}
  export class MaterialIndicator extends React.Component<IndicatorProps> {}
  export class PacmanIndicator extends React.Component<IndicatorProps> {}
  export class PulseIndicator extends React.Component<IndicatorProps> {}
  export class UIActivityIndicator extends React.Component<IndicatorProps> {}
  export class WaveIndicator extends React.Component<IndicatorProps> {}
}
