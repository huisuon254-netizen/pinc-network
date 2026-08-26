import React from 'react';
export default class AppErrorBoundary extends React.Component<{children: React.ReactNode},{hasError:boolean}> {
  state={hasError:false};
  static getDerivedStateFromError(){return {hasError:true};}
  render(){return this.state.hasError ? <div style={{padding:'2rem',color:'red'}}>Error</div> : this.props.children;}
}
