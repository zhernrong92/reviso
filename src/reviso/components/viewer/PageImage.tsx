import { useState } from 'react';
import { Box, Typography } from '@mui/material';

interface PageImageProps {
  src: string;
  width: number;
  height: number;
}

export const PageImage: React.FC<PageImageProps> = ({ src, width, height }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Typography color="text.secondary">Image not available</Typography>
      </Box>
    );
  }

  return (
    <img
      src={src}
      width={width}
      height={height}
      alt="Document page"
      onError={() => setError(true)}
      draggable={false}
      style={{ display: 'block', userSelect: 'none' }}
    />
  );
};
