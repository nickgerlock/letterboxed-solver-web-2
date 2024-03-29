<script lang="ts">
  import { onMount } from 'svelte';
  import { initializeWordList, findSolutions, quickGame } from 'letterboxed-solver';
  import { chunk } from './lib/chunk';

  type SolutionResult = { status: 'solved', solutions: string[][]} | { status: 'invalid_puzzle'} | {status: 'unsolvable_puzzle'};

  function submitDisabled() {
    return !lettersValid(puzzleLetters) || loading;
  }
  
  function getSolveButtonText(loading: boolean) {
    return loading ? 'Solving...' : 'Solve';
  }

  function lettersValid(letters: string) {
    const isComplete = letters.length === 15;
    const isUnique = hasUniqueLetters(letters);

    return isComplete && isUnique;
  }

  function hasUniqueLetters(letters: string) {
    const trimmed = letters.replace(/ /g, '');
    
    return new Set(trimmed).size === trimmed.length;
  }

  async function doSolve(puzzleLetters: string): Promise<SolutionResult> {
    const testGame = quickGame(puzzleLetters)
    if (!testGame) {
      return {
        status: 'invalid_puzzle',
      }
    }

    const solutions = await findSolutions(testGame.board, Infinity, 2, []);
    solutions.sort((a, b) => {
      return a.join('').length - b.join('').length;
    });

    if (!solutions || solutions.length === 0) {
      return {
        status: 'unsolvable_puzzle',
      }
    }

    return {
      status: 'solved',
      solutions,
    };
  }

  let puzzleLetters: string = $state("");
  let message: string | undefined = $state("");
  let solutions: string[][] | undefined = $state();
  let loading: boolean = $state(false);
  let solutionsPromise: Promise<string[][] | undefined> | undefined = $state();

  async function displaySolution() {
  }

  function onSubmit(event: Event) {
    event.preventDefault();
    message = undefined;
    solutions = undefined;
    loading = true;

    // @ts-ignore
    const executeCallback = window.requestIdleCallback
      ? (f: IdleRequestCallback) => requestIdleCallback(f, {timeout: 1000})
      : (f: IdleRequestCallback) => setTimeout(f, 10); // Safari doesn't support requestIdleCallback 🙃

    executeCallback(async () => {
      const result = await doSolve(puzzleLetters);
      if (result.status === 'invalid_puzzle') {
        message = 'Invalid Puzzle 😳';
      } else if (result.status === 'unsolvable_puzzle') {
        message = 'Unsolvable Puzzle 😔';
      } else {
        solutions = result.solutions;
      }
      loading = false;
    });
  }

  function getFormattedPuzzleLetters(string: string, isBackspacing=false) {
    const cleanedString = puzzleLetters.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const trimmedString = cleanedString.slice(0, 12);
    const wordsArray = chunk(Array.from(trimmedString), 3).map(word => word.join(''));
    const lastWordComplete = wordsArray.at(-1)?.length === 3;
    const puzzleFull = lastWordComplete && wordsArray.length === 4;
    let finalWordsArray: string[] = wordsArray;
    if (lastWordComplete && !puzzleFull && !isBackspacing) {
      finalWordsArray = [...wordsArray, ""];
    }
    const formattedString = finalWordsArray.join(' ');

    return formattedString;
  }

  function onPuzzleLettersInput(event: Event & { currentTarget: HTMLInputElement}) {
    console.log("input triggered")
    const inputEvent = event as (InputEvent & { currentTarget: HTMLInputElement});
    const isTyping = inputEvent?.inputType === 'insertText';
    const isBackspacing = inputEvent?.inputType === 'deleteContentBackward';

    puzzleLetters = getFormattedPuzzleLetters(puzzleLetters, isBackspacing);
  }

  onMount(async () => {
    console.log("Loading word list...");
    await initializeWordList();
    console.log("Word list loaded.");
  });

</script>

<main>
  <h1>Letter Boxed™️ Solver</h1>
  <div class="spacer"></div>
  <div class="content">
    <form class="solvePuzzleForm" onsubmit={onSubmit}>
      <div class="inputWrapper">
        <input
          class="puzzleLettersInput"
          bind:value={puzzleLetters}
          oninput={onPuzzleLettersInput}
          id="puzzle_letters"
          type="text"
          placeholder="ABC DEF GHI JKL"
          title="Please enter 3 letters at a time, separated by spaces."
        >
      </div>

      <div class="uniqueLettersMessage">
        {#if !hasUniqueLetters(puzzleLetters)}
          Puzzle must contain no repeated letters.
        {/if}
      </div>

      <div>
        <input disabled={submitDisabled()} class="findSolutionsButton" id="submit" type="submit" value={getSolveButtonText(loading)}>
      </div>
    </form>

    <div class="horizontalDivider">
    </div>

    {#if message}
      <h2 class="message">
        {message}
      </h2>
    {/if}

    <div class="solutionsContainer">
      {#if solutions}
        <div class="solutionsTableSegment">
          <div class="tableAndHeaderGroup">
            <div class="solutionsTableHeader">
              <h4>Solutions</h4>
            </div>
            <div class="solutionsTableWrapper">
                <table class="solutions">
                  <tbody>
                      {#each solutions as solution}
                        <tr class="solution">
                          <td>{solution[0] || ""}</td>
                          <td>{solution?.[1] || ""}</td>
                        </tr>
                      {/each}
                  </tbody>
                </table>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
  * {
    /* font-family: Helvetica, sans-serif */
    font-family: Helvetica, sans-serif;
  }
  body {
    color: #292929;
    background: #222222;
  }
  @media (width <= 800px) {
    h1 {
      font-size: xx-large;
    }
  }
  @media (width > 800px) {
    h1 {
      font-size: 3.2em;
      line-height: 1.1;
    }
  }
  div.content {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 1em;
    flex-grow: 0;
    flex-shrink: 1;
    width: 100%;
  }
  /* div.inputWrapper {
    border: solid 1px black;
    width: 12em;
  } */
  input.puzzleLettersInput {
    font-size: x-large;
    width: 12em;
    height: 2em;
    font-family: monospace;
    padding-left: 1.4em;
    box-sizing: border-box;
  }
  div.horizontalDivider {
    border-style: solid;
    border-width: 0px;
    border-bottom-width: 1px;
    border-color: var(--divider-color);
  }
  .solutionsContainer {
    min-height: 0px;
    overflow-y: hidden;
    display: flex;
    flex-direction: column;
  }
  .tableAndHeaderGroup {
    flex-wrap: wrap;
    /* align-content: center; */
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    max-width: 480px;
  }
  .solutionsTableHeader {
    border-width: 1px;
    border-style: solid;
    border-color: var(--border-color);
    border-collapse: collapse;
    box-sizing: border-box;
    border-bottom-width: 0px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
  }
  .solutionsTableHeader h3, h4 {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }
  .solutionsTableSegment {
    display: flex;
    overflow: scroll;
    padding: 1em;
    flex-wrap: wrap;
    justify-content: center;
  }
  .solutionsTableWrapper {
    width: 100%;
    border-width: 1px;
    border-style: solid;
    border-radius: 10px;
    border-color: var(--border-color);
    text-align: center;
    border-top-left-radius: 0px;
    border-top-right-radius: 0px;
    min-width: fit-content;
  }
  table.solutions {
    text-align: left;
    border-collapse: collapse;
    width: 100%;
    display: flex;
    flex-direction: column;
    min-width: fit-content;
  }

  table.solutions tbody {
    min-width: fit-content;
  }

  table.solutions tr {
    display: flex;
    flex-wrap: wrap;
    border-style: solid;
    border-width: 0px;
    border-bottom-width: 1px;
    border-color: var(--table-divider-color);
    min-width: fit-content;
  }
  table.solutions tr:last-child tr {
    border-bottom-width: 0px;
  }
  table.solutions td {
    padding: 2px 1em;
    width: 50%;
    min-width: fit-content;
  }
  main {
    display: contents;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 1em;
    padding-bottom: 1em;
    box-sizing: border-box;

    max-height: 100%;
    min-height: 0px;
    overflow-y: hidden;
  }
  form.solvePuzzleForm {
    display: flex;
    flex-direction: column;
  }
  div.uniqueLettersMessage {
    height: 2em;
  }
  input.findSolutionsButton {
    width: 8em;
    height: 2em;
    font-size: large;
  }
  @media (height > 1000px) {
    div.spacer {
      height: 4em;
      flex-shrink: 0;
    }
  }
  @media (height <= 1000px) {
    div.spacer {
      height: 2em;
      flex-shrink: 0;
    }
  }
  * {
    box-sizing: border-box;
  }
</style>
