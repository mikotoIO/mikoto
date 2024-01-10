import {
  Capture,
  MatchFunction,
  Parser,
  State,
} from '@khanacademy/simple-markdown';

export interface RuleOption<T> {
  order: number;
  match: MatchFunction;
  parse(capture: Capture, nestedParse: Parser, state: State): T;
  react(node: T, _: any, state: any): JSX.Element;
}

export function createRule<T>(option: RuleOption<T>) {
  return option;
}
