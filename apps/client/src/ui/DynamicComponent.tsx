export type DynamicComponentProps<
  K extends keyof any,
  T extends { [P in K]: React.ComponentType<any> },
> = {
  componentMap: T;
  name: K;
  props: React.ComponentProps<T[K]>;
};

export function DynamicComponent<
  K extends keyof any,
  T extends { [P in K]: React.ComponentType<any> },
>({ componentMap, name, props }: DynamicComponentProps<K, T>): JSX.Element {
  const Component = componentMap[name];
  if (!Component) return <></>;

  return <Component {...props} />;
}
