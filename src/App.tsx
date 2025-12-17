import {
  HeroScreen,
  ProblemScreen,
  SolutionScreen,
  SpecsScreen,
  ScenariosScreen,
  MarketScreen,
  IPScreen,
  CTAScreen,
} from './components';

function App() {
  return (
    <main className="bg-dark-900 min-h-screen">
      <HeroScreen />
      <ProblemScreen />
      <SolutionScreen />
      <SpecsScreen />
      <ScenariosScreen />
      <MarketScreen />
      <IPScreen />
      <CTAScreen />
    </main>
  );
}

export default App;
