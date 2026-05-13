import Stack from "./Stack";

export default function Section({ children, gap = "md", style }) {
  return (
    <Stack gap={gap} style={style}>
      {children}
    </Stack>
  );
}
