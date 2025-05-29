import {
  englishDataset,
  englishRecommendedTransformers,
  RegExpMatcher,
} from 'obscenity';

export default class XStringVerify {
  public static Verify(input: string): boolean {
    const matcher = new RegExpMatcher({
      ...englishDataset.build(),
      ...englishRecommendedTransformers,
    });

    return !matcher.hasMatch(input);
  }
}
