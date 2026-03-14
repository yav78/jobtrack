export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Jobtrack API",
    version: "1.0.0",
    description: "Mini CRM for job search — REST API reference",
  },
  servers: [{ url: "/api", description: "API base" }],
  tags: [
    { name: "companies", description: "Entreprises" },
    { name: "contacts", description: "Contacts" },
    { name: "opportunities", description: "Opportunités" },
    { name: "actions", description: "Actions" },
    { name: "export", description: "Export CSV" },
    { name: "trash", description: "Corbeille" },
    { name: "dashboard", description: "Tableau de bord" },
  ],
  paths: {
    "/companies": {
      get: {
        tags: ["companies"],
        summary: "Liste paginée des entreprises",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
          { name: "q", in: "query", schema: { type: "string" }, description: "Recherche par nom" },
        ],
        responses: {
          200: { description: "Liste paginée", content: { "application/json": { schema: { $ref: "#/components/schemas/CompanyPage" } } } },
        },
      },
      post: {
        tags: ["companies"],
        summary: "Créer une entreprise",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CompanyCreate" } } } },
        responses: {
          201: { description: "Entreprise créée" },
          400: { description: "Données invalides" },
        },
      },
    },
    "/companies/{id}": {
      get: {
        tags: ["companies"],
        summary: "Détail d'une entreprise (avec lieux et contacts)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Entreprise" },
          404: { description: "Non trouvée" },
        },
      },
      patch: {
        tags: ["companies"],
        summary: "Modifier une entreprise",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CompanyCreate" } } } },
        responses: { 200: { description: "Mis à jour" }, 404: { description: "Non trouvée" } },
      },
      delete: {
        tags: ["companies"],
        summary: "Supprimer (soft delete) une entreprise et ses contacts",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Supprimée" }, 404: { description: "Non trouvée" } },
      },
    },
    "/companies/bulk": {
      post: {
        tags: ["companies"],
        summary: "Supprimer plusieurs entreprises (soft delete)",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BulkIds" } } } },
        responses: { 200: { description: "Supprimées" } },
      },
    },
    "/contacts": {
      get: {
        tags: ["contacts"],
        summary: "Liste paginée des contacts",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "companyId", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: { 200: { description: "Liste paginée" } },
      },
      post: {
        tags: ["contacts"],
        summary: "Créer un contact",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ContactCreate" } } } },
        responses: { 201: { description: "Contact créé" } },
      },
    },
    "/contacts/{id}": {
      get: { tags: ["contacts"], summary: "Détail d'un contact (avec canaux)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { 200: { description: "Contact" }, 404: { description: "Non trouvé" } } },
      patch: { tags: ["contacts"], summary: "Modifier un contact", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ContactCreate" } } } }, responses: { 200: { description: "Mis à jour" } } },
      delete: { tags: ["contacts"], summary: "Supprimer (soft delete) un contact", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { 200: { description: "Supprimé" } } },
    },
    "/contacts/bulk": {
      post: {
        tags: ["contacts"],
        summary: "Supprimer plusieurs contacts (soft delete)",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BulkIds" } } } },
        responses: { 200: { description: "Supprimés" } },
      },
    },
    "/opportunities": {
      get: {
        tags: ["opportunities"],
        summary: "Liste paginée des opportunités",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["SOURCING","APPLIED","INTERVIEW","OFFER_RECEIVED","OFFER_ACCEPTED","REJECTED"] } },
        ],
        responses: { 200: { description: "Liste paginée" } },
      },
      post: {
        tags: ["opportunities"],
        summary: "Créer une opportunité",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/OpportunityCreate" } } } },
        responses: { 201: { description: "Créée" } },
      },
    },
    "/opportunities/{id}": {
      get: { tags: ["opportunities"], summary: "Détail d'une opportunité", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { 200: { description: "Opportunité" }, 404: { description: "Non trouvée" } } },
      patch: { tags: ["opportunities"], summary: "Modifier une opportunité (statut, relance…)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/OpportunityUpdate" } } } }, responses: { 200: { description: "Mis à jour" } } },
      delete: { tags: ["opportunities"], summary: "Supprimer (soft delete) une opportunité", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { 200: { description: "Supprimée" } } },
    },
    "/opportunities/bulk": {
      post: {
        tags: ["opportunities"],
        summary: "Supprimer plusieurs opportunités (soft delete)",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BulkIds" } } } },
        responses: { 200: { description: "Supprimées" } },
      },
    },
    "/opportunities/{id}/actions": {
      get: { tags: ["actions"], summary: "Actions liées à une opportunité", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { 200: { description: "Liste d'actions" } } },
      post: { tags: ["actions"], summary: "Créer une action sur une opportunité", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ActionCreate" } } } }, responses: { 201: { description: "Créée" } } },
    },
    "/actions": {
      get: {
        tags: ["actions"],
        summary: "Toutes les actions (chronologie globale)",
        parameters: [
          { name: "type", in: "query", schema: { type: "string" }, description: "Filtrer par type d'action" },
          { name: "contactId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "companyId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "workOpportunityId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "offset", in: "query", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "{ items: OpportunityAction[] }" } },
      },
      post: { tags: ["actions"], summary: "Créer une action standalone (sans opportunité obligatoire)", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ActionCreate" } } } }, responses: { 201: { description: "Créée" } } },
    },
    "/export/opportunities": {
      get: { tags: ["export"], summary: "Exporter les opportunités en CSV", responses: { 200: { description: "Fichier CSV", content: { "text/csv": {} } } } },
    },
    "/export/contacts": {
      get: { tags: ["export"], summary: "Exporter les contacts en CSV", responses: { 200: { description: "Fichier CSV", content: { "text/csv": {} } } } },
    },
    "/export/companies": {
      get: { tags: ["export"], summary: "Exporter les entreprises en CSV", responses: { 200: { description: "Fichier CSV", content: { "text/csv": {} } } } },
    },
    "/trash": {
      get: { tags: ["trash"], summary: "Lister les éléments dans la corbeille (entreprises, contacts, opportunités)", responses: { 200: { description: "{ companies, contacts, opportunities }" } } },
    },
    "/trash/{entity}/{id}": {
      patch: {
        tags: ["trash"],
        summary: "Restaurer un élément supprimé",
        parameters: [
          { name: "entity", in: "path", required: true, schema: { type: "string", enum: ["companies", "contacts", "opportunities"] } },
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { 200: { description: "Restauré" }, 404: { description: "Non trouvé dans la corbeille" } },
      },
      delete: {
        tags: ["trash"],
        summary: "Supprimer définitivement un élément",
        parameters: [
          { name: "entity", in: "path", required: true, schema: { type: "string", enum: ["companies", "contacts", "opportunities"] } },
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { 200: { description: "Supprimé définitivement" } },
      },
    },
    "/dashboard/overview": {
      get: {
        tags: ["dashboard"],
        summary: "Statistiques globales + actions récentes + pipeline",
        responses: { 200: { description: "{ stats, recentActions }" } },
      },
    },
  },
  components: {
    schemas: {
      CompanyCreate: {
        type: "object",
        required: ["name", "typeCode"],
        properties: {
          name: { type: "string" },
          typeCode: { type: "string", enum: ["CLIENT_FINAL", "ESN", "PORTAGE", "OTHER"] },
          website: { type: "string", format: "uri" },
          notes: { type: "string" },
        },
      },
      CompanyPage: {
        type: "object",
        properties: {
          items: { type: "array", items: { $ref: "#/components/schemas/Company" } },
          total: { type: "integer" },
          page: { type: "integer" },
          pageSize: { type: "integer" },
        },
      },
      Company: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          typeCode: { type: "string" },
          website: { type: "string" },
          notes: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ContactCreate: {
        type: "object",
        required: ["companyId", "firstName", "lastName"],
        properties: {
          companyId: { type: "string", format: "uuid" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          roleTitle: { type: "string" },
          notes: { type: "string" },
        },
      },
      OpportunityCreate: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          companyId: { type: "string", format: "uuid" },
        },
      },
      OpportunityUpdate: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          companyId: { type: "string", format: "uuid" },
          status: { type: "string", enum: ["SOURCING", "APPLIED", "INTERVIEW", "OFFER_RECEIVED", "OFFER_ACCEPTED", "REJECTED"] },
          followUpAt: { type: "string", format: "date-time" },
        },
      },
      ActionCreate: {
        type: "object",
        required: ["occurredAt", "type"],
        properties: {
          occurredAt: { type: "string", format: "date-time" },
          type: { type: "string", enum: ["INTERVIEW","APPLIED","INBOUND_CONTACT","OUTBOUND_CONTACT","MESSAGE","CALL","FOLLOW_UP","OFFER_RECEIVED","OFFER_ACCEPTED","REJECTED","NOTE"] },
          notes: { type: "string" },
          contactId: { type: "string", format: "uuid" },
          companyId: { type: "string", format: "uuid" },
          contactChannelId: { type: "string", format: "uuid" },
          participantContactIds: { type: "array", items: { type: "string", format: "uuid" } },
        },
      },
      BulkIds: {
        type: "object",
        required: ["ids"],
        properties: {
          ids: { type: "array", items: { type: "string", format: "uuid" }, minItems: 1 },
        },
      },
    },
  },
} as const;
