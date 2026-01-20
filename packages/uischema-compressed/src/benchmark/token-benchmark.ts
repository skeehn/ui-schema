import { expandShorthand } from "../expansion/expand";

type BenchmarkCase = {
  name: string;
  shorthand: string;
};

const estimateTokens = (text: string) => Math.ceil(text.length / 4);

const cases: BenchmarkCase[] = [
  {
    name: "Dashboard",
    shorthand: "c[ariaLabel:Dashboard][children:row[children:txt[text:Metrics]|btn[text:Refresh;ariaLabel:Refresh metrics]]|grid[children:card[ariaLabel:Card]|card[ariaLabel:Card]]]"
  },
  {
    name: "Form",
    shorthand:
      "c[ariaLabel:Signup][children:txt[text:Create account]|form[children:in[ariaLabel:Email;placeholder:you@site.com]|in[ariaLabel:Password;placeholder:••••••]|btn[text:Submit;ariaLabel:Submit form]]]"
  },
  {
    name: "Settings",
    shorthand:
      "c[ariaLabel:Settings][children:txt[text:Preferences]|row[children:txt[text:Notifications]|sw[ariaLabel:Notifications toggle]]]"
  }
];

export const runBenchmark = () =>
  cases.map((entry) => {
    const expanded = expandShorthand(entry.shorthand);
    const expandedJson = JSON.stringify(expanded);
    const shorthandTokens = estimateTokens(entry.shorthand);
    const expandedTokens = estimateTokens(expandedJson);
    return {
      name: entry.name,
      shorthandTokens,
      expandedTokens,
      reduction: Number((expandedTokens / shorthandTokens).toFixed(2))
    };
  });

if (typeof require !== "undefined" && require.main === module) {
  const results = runBenchmark();
  console.log("Token Benchmark (heuristic tokens ~= chars/4)");
  results.forEach((result) => {
    console.log(
      `${result.name}: shorthand=${result.shorthandTokens}, expanded=${result.expandedTokens}, ratio=${result.reduction}x`
    );
  });
}
