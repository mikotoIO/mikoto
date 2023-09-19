export interface RuleOption<T> {
  order: number;
  match(source: string): RegExpExecArray | null;
  parse(capture: RegExpExecArray): T;
  react(node: T, _: any, state: any): JSX.Element;
}

export function createRule<T>(option: RuleOption<T>) {
  return option;
}
