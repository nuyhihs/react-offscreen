# react-offscreen

React component and hook which listens to view is offscreen

### `useOffscreen` Hook

```jsx
import { useOffscreen } from 'react-offscreen';
```

```jsx
const [ref, isOffscreen] = useOffscreen(false, 200);

return (
  <div ref={ref}>
    <style jsx>{styles}</style>
  </div>
);
```