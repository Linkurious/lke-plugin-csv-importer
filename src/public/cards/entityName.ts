import { EntitiesTypes } from "../models";

export class CSVEntityName {
  private container!: HTMLElement;
  private entityName!: HTMLElement;
  private titleHolder!: HTMLElement;

  private titleCompleter = ["node category", "edge type"];

  init() {
    this.container = document.getElementsByClassName(
      "entityNameContainer"
    )[0] as HTMLElement;
    this.titleHolder = this.container.getElementsByClassName(
      "titleCard"
    )[0] as HTMLElement;
    this.entityName = document.getElementById("nameCat") as HTMLElement;
    this.hideCard();
  }

  setTitle(entityType: EntitiesTypes) {
    this.titleHolder.innerText = `Is this the ${this.titleCompleter[entityType]}?`;
  }

  /**
   * Using data in session storage, show node category name to user
   */
  setNameCategory() {
    const categoryName = sessionStorage.getItem("entityName");
    if (categoryName) {
      this.entityName.innerText = categoryName;
    }
  }

  hideCard() {
    this.container.style.display = "none";
  }

  showCard(entityType?: EntitiesTypes) {
    if (entityType !== undefined) {
      this.setTitle(entityType);
    }
    this.setNameCategory();
    this.container.style.display = "block";
  }
}
