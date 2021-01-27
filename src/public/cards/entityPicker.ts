import { EntitiesTypes } from "../models";

export class CSVEntityPicker {
  private container!: HTMLElement;
  private options!: NodeListOf<HTMLInputElement>;
  private nextButton!: HTMLButtonElement;

  private checkedOptions: EntitiesTypes | null = null;

  init() {
    this.container = document.getElementsByClassName(
      "pickEntityContainer"
    )[0] as HTMLElement;
    this.options = document.getElementsByName(
      "entities"
    ) as NodeListOf<HTMLInputElement>;
    this.options[EntitiesTypes.nodes].addEventListener("change", () =>
      this.updateRadioButton(EntitiesTypes.nodes)
    );
    this.options[EntitiesTypes.edges].addEventListener("change", () =>
      this.updateRadioButton(EntitiesTypes.edges)
    );
    this.nextButton = document.getElementById(
      "nextButtonEntity"
    ) as HTMLButtonElement;
    this.cleanState();
    this.hideCard();
  }

  cleanState() {
    this.checkedOptions = null;
    this.options[0].checked = false;
    this.options[1].checked = false;
    this.nextButton.disabled = true;
  }

  updateRadioButton(value: EntitiesTypes) {
    if (value === EntitiesTypes.nodes) {
      this.options[0].checked = true;
      this.options[1].checked = false;
    } else {
      this.options[0].checked = false;
      this.options[1].checked = true;
    }
    this.checkedOptions = value;
    this.nextButton.disabled = false;
  }

  hideCard() {
    this.container.style.display = "none";
    return this.checkedOptions;
  }

  showCard() {
    this.container.style.display = "block";
  }
}
