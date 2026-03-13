import { AbstractCrudService } from "./abstract-crus.service";

class EntretienService extends AbstractCrudService {
  constructor() {
    super("entretiens");
  }
}

export default new EntretienService();
