/* 
  MyTask 
  Defined by a single line string in the format:
  TaskDescription::Outcome1/Outcome2...
  where :: delimitts description and outcomes
  and slash delimits each possible outcome
 */
export default class Task {
    constructor(defString){
        this._defString = defString;
        let parts = this._defString.split("::");
        if (parts.length != 2) {
            throw new SyntaxError(
                `Invalid Task definition: ${this._defString}`);
        };
        this._taskDescription = parts[0];
        this._taskOutcomes = parts[1].split("/");
        if (this._taskOutcomes.length == 0) {
            throw new SyntaxError(
                `Invalid Task definition: ${this._defString}\n
                missing outcomes`);
        }
    }
    get taskDescription() {
        return this._taskDescription;
    }
    get taskOutcomes (){
        return this._taskOutcomes;
    }
}