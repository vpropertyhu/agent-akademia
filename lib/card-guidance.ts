/** Browser-only guidance. Execution rules remain in pilot-plan.ts. */
import {pilotModules, planProblem, type PilotStep} from './pilot-plan';
import {blocks, definition, flatten, repairSteps, type Block, type Piece} from './module-builder';

export const maxPilotCards = 7;
export const maxBuilderCards = 40;
export const needsText = (id: string) => ['summarize', 'translate', 'review', 'image'].includes(id);
export const makesText = (id: string) => id === 'write' || id === 'tasks';
export const pilotCardHelp: Record<PilotStep, {minimum: number; requirement: string}> = {
 search: {minimum: 2, requirement: 'Első helyre kerül. Mellé Megírja vagy Teendőket készít is kell.'},
 write: {minimum: 1, requirement: 'Önállóan is elég. Csak írd le, mit készítsen.'},
 tasks: {minimum: 1, requirement: 'Önállóan is elég. Csak írd le, miben segítsen.'},
 summarize: {minimum: 2, requirement: 'Előtte Megírja vagy Teendőket készít kell.'},
 translate: {minimum: 2, requirement: 'Előtte Megírja vagy Teendőket készít kell. A célnyelvet írd a feladatba.'},
 review: {minimum: 2, requirement: 'Előtte Megírja vagy Teendőket készít kell.'},
 image: {minimum: 2, requirement: 'Előtte Megírja vagy Teendőket készít kell. Ez az utolsó kártya.'},
};

export function cardProblem(steps: PilotStep[]): string | null {
 return planProblem({version: 1, name: 'Segítő', brief: 'A kártyák ellenőrzése', steps});
}

/** Keep existing relative order except where a card has an explicit position rule. */
export function orderedCards(steps: PilotStep[]): PilotStep[] {
 const next = [...steps];
 const search = next.indexOf('search');
 if (search > 0) next.unshift(...next.splice(search, 1));
 const image = next.indexOf('image');
 if (image >= 0 && image !== next.length - 1) next.push(...next.splice(image, 1));
 const firstConsumer = next.findIndex(needsText), producer = next.findIndex(makesText);
 if (firstConsumer >= 0 && producer > firstConsumer) next.splice(firstConsumer, 0, ...next.splice(producer, 1));
 return next;
}

export function addPilotCard(steps: PilotStep[], id: PilotStep): PilotStep[] {
 if (steps.includes(id) || steps.length >= maxPilotCards) return steps;
 return orderedCards([...steps, id]);
}

export function pilotSelection(steps: PilotStep[]) {
 const missingBase = !steps.some(makesText);
 const reordered = orderedCards(steps);
 const orderWrong = !missingBase && reordered.join(',') !== steps.join(',');
 return {missingBase, orderWrong, reordered, problem: cardProblem(steps)};
}

const supportedIds = new Set<string>(['request', 'document', ...pilotModules.map(m => m.id)]);
export const supportedInPilot = (id: string) => supportedIds.has(id);

/** A minimum connected example for the broad planning catalogue, not a runtime promise. */
export function minimumExample(block: Block): string[] {
 if (!block.inputs.length) return [block.id];
 return [...repairSteps([{uid: 'help', block: block.id}], 0), block.id];
}

export function builderCardHelp(block: Block) {
 const example = needsText(block.id) || block.id === 'document' ? ['request', 'write', block.id] : minimumExample(block);
 const names = example.slice(0, -1).map(id => blocks.find(b => b.id === id)!.name);
 return {
  minimum: example.length,
  requirement: names.length ? `Elé kell például: ${names.join(' → ')}.` : 'Kezdőkártya. Utána válassz egy feladatot is.',
  supported: supportedInPilot(block.id),
 };
}

export function builderRepairCards(pieces: Piece[], index: number): string[] {
 const piece = pieces[index];
 if (!piece) return [];
 const first = flatten([piece])[0];
 if (index === 0 && supportedInPilot(first.block) && (needsText(first.block) || first.block === 'document')) return ['request', 'write'];
 return repairSteps(pieces, index);
}

export function builderSelection(pieces: Piece[]) {
 const leaves = flatten(pieces);
 const actions = leaves.filter(p => p.block !== 'request' && p.block !== 'document');
 const unsupported = [...new Set(leaves.filter(p => !supportedInPilot(p.block)).map(p => definition(p).name))];
 const steps = actions.filter(p => supportedInPilot(p.block)).map(p => p.block as PilotStep);
 const duplicateNames = [...new Set(steps.filter((id, i) => steps.indexOf(id) !== i))].map(id => blocks.find(b => b.id === id)?.name || id);
 const selection = pilotSelection(steps);
 const problems: string[] = [];
 if (unsupported.length) problems.push(`Itt még nem futtatható: ${unsupported.join(', ')}.`);
 if (steps.length > maxPilotCards) problems.push(`A webes próbában legfeljebb ${maxPilotCards} AI-feladat lehet. Most ${steps.length} van.`);
 if (duplicateNames.length) problems.push(`Minden AI-feladat egyszer szerepelhet. Többször választottad: ${duplicateNames.join(', ')}.`);
 if (selection.missingBase) problems.push('A webes próbához Szövegírás vagy Teendőlista készítése is kell.');
 else if (selection.problem && !duplicateNames.length && steps.length <= maxPilotCards) problems.push(selection.problem.replaceAll('Megírja', 'Szövegírás').replaceAll('Teendőket készít', 'Teendőlista készítése').replaceAll('Képet készít', 'Képkészítés'));
 return {leaves, steps, unsupported, problems, hasTask: leaves.some(p => definition(p).inputs.length > 0)};
}
