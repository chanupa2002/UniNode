import { useEffect, useMemo, useRef, useState } from "react";

function getMessage(payload) {
  const message = payload?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return "Unable to complete the request right now.";
}

function getResourceMark(type) {
  const normalized = (type || "R").trim();
  if (!normalized) return "R";

  return normalized
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();
}

function PlusSquareIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 8v8M8 12h8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <circle
        cx="11"
        cy="11"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m20 20-4.2-4.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="m7 10 5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function ResourcesSection({ apiBaseUrl, token }) {
  const [query, setQuery] = useState("");
  const [allResources, setAllResources] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const typeFilterRef = useRef(null);

  const normalizedQuery = query.trim().toLowerCase();
  const resourceTypes = useMemo(
    () =>
      [
        ...new Set(
          allResources.map((resource) => resource.type).filter(Boolean),
        ),
      ].sort((left, right) => left.localeCompare(right)),
    [allResources],
  );

  const filteredResources = useMemo(
    () =>
      allResources.filter((resource) => {
        const matchesQuery =
          !normalizedQuery ||
          (resource.name || "").toLowerCase().includes(normalizedQuery);
        const matchesType =
          selectedTypes.length === 0 || selectedTypes.includes(resource.type);
        const rawAvailability = resource?.available ?? resource?.availability;
        const availabilityValue =
          rawAvailability === true || rawAvailability === false
            ? rawAvailability
            : rawAvailability === 1 ||
              rawAvailability === "1" ||
              rawAvailability === "true";
        const matchesAvailability =
          !availableOnly || availabilityValue === true;

        return matchesQuery && matchesType && matchesAvailability;
      }),
    [allResources, availableOnly, normalizedQuery, selectedTypes],
  );

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        typeFilterRef.current &&
        !typeFilterRef.current.contains(event.target)
      ) {
        setIsTypeFilterOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadResources() {
      setLoading(true);
      setError("");

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(`${apiBaseUrl}/api/facilities`, {
          headers,
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(getMessage(payload));
        }

        setAllResources(Array.isArray(payload) ? payload : []);
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        setAllResources([]);
        setError(requestError.message || "Unable to load resources right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadResources();
    return () => controller.abort();
  }, [apiBaseUrl, token]);

  const toggleTypeSelection = (type) => {
    setSelectedTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  };

  return (
    <div className="resources-shell">
      <div className="workspace-header">
        <div className="workspace-title-block">
          <h2>Campus Resources</h2>
        </div>

        <div className="workspace-toolbar">
          <label
            className="workspace-search resources-search"
            htmlFor="resource-search"
          >
            <SearchIcon />
            <input
              id="resource-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search resource name..."
              type="search"
              value={query}
            />
          </label>

          <div className="resource-filter" ref={typeFilterRef}>
            <button
              aria-expanded={isTypeFilterOpen}
              className={`resource-filter-trigger ${isTypeFilterOpen ? "resource-filter-trigger-open" : ""}`}
              onClick={() => setIsTypeFilterOpen((value) => !value)}
              type="button"
            >
              <span className="resource-filter-trigger-copy">
                {selectedTypes.length === 0
                  ? "All Types"
                  : `${selectedTypes.length} Type${selectedTypes.length === 1 ? "" : "s"}`}
              </span>
              <span className="resource-filter-trigger-icon">
                <ChevronDownIcon />
              </span>
            </button>

            <div
              className={`resource-filter-menu ${isTypeFilterOpen ? "resource-filter-menu-open" : ""}`}
            >
              <div className="resource-filter-menu-header">
                <strong>Resource Types</strong>
                {selectedTypes.length > 0 ? (
                  <button
                    className="resource-filter-clear"
                    onClick={() => setSelectedTypes([])}
                    type="button"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <div className="resource-filter-options">
                {resourceTypes.length === 0 ? (
                  <div className="resource-filter-empty">
                    No resource types found.
                  </div>
                ) : (
                  resourceTypes.map((type) => (
                    <label className="resource-filter-option" key={type}>
                      <input
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleTypeSelection(type)}
                        type="checkbox"
                      />
                      <span>{type}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <label className="resources-available-toggle">
            <input
              checked={availableOnly}
              onChange={(event) => setAvailableOnly(event.target.checked)}
              type="checkbox"
            />
            <span>Available Only</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="resources-state-card">
          <div className="resources-loading-dots">
            <span />
            <span />
            <span />
          </div>
          <strong>Loading resources...</strong>
          <span>Fetching the latest campus resource list.</span>
        </div>
      ) : error ? (
        <div className="resources-state-card resources-state-error">
          <strong>Could not load resources</strong>
          <span>{error}</span>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="resources-state-card">
          <strong>No resources found</strong>
          <span>
            {normalizedQuery
              ? `No resource names matched "${query.trim()}".`
              : selectedTypes.length > 0
                ? "No resources matched the selected type filters."
                : "No resources are available in the catalog yet."}
          </span>
        </div>
      ) : (
        <div className="resource-grid">
          {filteredResources.map((resource) => (
            <article
              className="resource-card"
              key={resource.id ?? `${resource.name}-${resource.location}`}
            >
              <div className="resource-card-top">
                <div className="resource-card-mark">
                  {getResourceMark(resource.type)}
                </div>
                <div className="resource-card-copy">
                  <h3>{resource.name || "Unnamed Resource"}</h3>
                  <span>
                    {resource.location || "Campus location not available"}
                  </span>
                </div>
                <span className="resource-type-badge">
                  {resource.type || "Resource"}
                </span>
              </div>

              <div className="resource-card-meta">
                <div className="resource-meta-item">
                  <span className="resource-meta-label">Capacity</span>
                  <strong>{resource.capacity ?? "N/A"}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminResourceManagementSection({ apiBaseUrl, token }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [pendingAvailabilityChange, setPendingAvailabilityChange] =
    useState(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [isChangingAvailability, setIsChangingAvailability] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState("");
  const [createName, setCreateName] = useState("");
  const [createCapacity, setCreateCapacity] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [editCapacity, setEditCapacity] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [deletingResource, setDeletingResource] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const queryValue = query.trim().toLowerCase();
  const typeOptions = useMemo(
    () =>
      [
        ...new Set(resources.map((resource) => resource.type).filter(Boolean)),
      ].sort((left, right) => left.localeCompare(right)),
    [resources],
  );

  function getCapacityNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsedValue = Number(value);
      return Number.isFinite(parsedValue) ? parsedValue : null;
    }

    return null;
  }

  const filteredResources = useMemo(() => {
    const parsedMin = minCapacity.trim() === "" ? null : Number(minCapacity);
    const parsedMax = maxCapacity.trim() === "" ? null : Number(maxCapacity);

    const min =
      parsedMin != null && Number.isFinite(parsedMin)
        ? parsedMax != null && Number.isFinite(parsedMax)
          ? Math.min(parsedMin, parsedMax)
          : parsedMin
        : null;

    const max =
      parsedMax != null && Number.isFinite(parsedMax)
        ? parsedMin != null && Number.isFinite(parsedMin)
          ? Math.max(parsedMin, parsedMax)
          : parsedMax
        : null;

    return resources.filter((resource) => {
      const resourceName = (resource.name || "").toLowerCase();
      const resourceId = resource.id == null ? "" : String(resource.id);
      const matchesQuery =
        !queryValue ||
        resourceName.includes(queryValue) ||
        resourceId.includes(queryValue);
      const matchesType = !selectedType || resource.type === selectedType;

      const capacityValue = getCapacityNumber(resource.capacity);
      const matchesMin =
        min == null || (capacityValue != null && capacityValue >= min);
      const matchesMax =
        max == null || (capacityValue != null && capacityValue <= max);
      const availabilityValue = getAvailabilityBoolean(resource);
      const matchesAvailability = !availableOnly || availabilityValue === true;

      return (
        matchesQuery &&
        matchesType &&
        matchesMin &&
        matchesMax &&
        matchesAvailability
      );
    });
  }, [
    availableOnly,
    maxCapacity,
    minCapacity,
    queryValue,
    resources,
    selectedType,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadResources() {
      setLoading(true);
      setError("");

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(`${apiBaseUrl}/api/facilities`, {
          headers,
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(getMessage(payload));
        }

        setResources(Array.isArray(payload) ? payload : []);
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        setResources([]);
        setError(requestError.message || "Unable to load resources right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadResources();
    return () => controller.abort();
  }, [apiBaseUrl, token]);

  const currentCapacityValue =
    editingResource?.capacity == null ? "" : String(editingResource.capacity);
  const currentLocationValue = editingResource?.location || "";
  const isEditDirty =
    editingResource != null &&
    (editCapacity !== currentCapacityValue ||
      editLocation !== currentLocationValue);

  function getAvailabilityBoolean(resource) {
    const rawValue = resource?.available ?? resource?.availability;
    if (rawValue === true || rawValue === false) {
      return rawValue;
    }
    if (rawValue === 1 || rawValue === "1" || rawValue === "true") {
      return true;
    }
    if (rawValue === 0 || rawValue === "0" || rawValue === "false") {
      return false;
    }
    return null;
  }

  function getAvailabilitySelectValue(resource) {
    const availabilityValue = getAvailabilityBoolean(resource);
    if (availabilityValue === true) return "available";
    if (availabilityValue === false) return "not-available";
    return "unknown";
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateType("");
    setCreateName("");
    setCreateCapacity("");
    setCreateLocation("");
    setCreateError("");
  };

  const saveCreatedResource = async () => {
    const trimmedType = createType.trim();
    const trimmedName = createName.trim();
    const trimmedLocation = createLocation.trim();

    if (!trimmedType || !trimmedName || !trimmedLocation) {
      setCreateError("Type, name, and location are required.");
      return;
    }

    const payload = {
      type: trimmedType,
      name: trimmedName,
      location: trimmedLocation,
    };

    if (createCapacity.trim() !== "") {
      const parsedCapacity = Number(createCapacity);
      if (!Number.isFinite(parsedCapacity) || parsedCapacity < 0) {
        setCreateError("Capacity must be a valid positive number.");
        return;
      }
      payload.capacity = parsedCapacity;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(
        `${apiBaseUrl}/api/facilities/createResource`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        },
      );

      const responsePayload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(getMessage(responsePayload));
      }

      setResources((current) =>
        [...current, responsePayload].sort((left, right) => {
          const leftId = left?.id ?? Number.MAX_SAFE_INTEGER;
          const rightId = right?.id ?? Number.MAX_SAFE_INTEGER;
          return leftId - rightId;
        }),
      );
      closeCreateModal();
    } catch (requestError) {
      setCreateError(
        requestError.message || "Unable to create the resource right now.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (resource) => {
    setEditingResource(resource);
    setEditCapacity(resource.capacity == null ? "" : String(resource.capacity));
    setEditLocation(resource.location || "");
    setEditError("");
    setIsCloseConfirmOpen(false);
  };

  const closeEditModal = (forceDiscard = false) => {
    if (editingResource && isEditDirty && !forceDiscard) {
      setIsCloseConfirmOpen(true);
      return;
    }

    setEditingResource(null);
    setEditCapacity("");
    setEditLocation("");
    setEditError("");
    setIsCloseConfirmOpen(false);
  };

  const requestAvailabilityChange = (resource, nextValue) => {
    if (nextValue !== "available" && nextValue !== "not-available") return;

    const currentValue = getAvailabilitySelectValue(resource);
    if (currentValue === nextValue) return;

    setAvailabilityError("");
    setPendingAvailabilityChange({
      resource,
      nextValue,
    });
  };

  const confirmAvailabilityChange = async () => {
    if (!pendingAvailabilityChange?.resource?.id) return;

    setIsChangingAvailability(true);
    setAvailabilityError("");

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(
        `${apiBaseUrl}/api/facilities/changeResourceAvailability`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            resource_id: pendingAvailabilityChange.resource.id,
            available: pendingAvailabilityChange.nextValue === "available",
          }),
        },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(getMessage(payload));
      }

      const nextAvailabilityValue = payload?.available;
      const normalizedAvailability =
        typeof nextAvailabilityValue === "boolean"
          ? nextAvailabilityValue
          : pendingAvailabilityChange.nextValue === "available";

      setResources((current) =>
        current.map((resource) =>
          resource.id === pendingAvailabilityChange.resource.id
            ? { ...resource, available: normalizedAvailability }
            : resource,
        ),
      );
      setPendingAvailabilityChange(null);
    } catch (requestError) {
      setAvailabilityError(
        requestError.message || "Unable to update availability right now.",
      );
    } finally {
      setIsChangingAvailability(false);
    }
  };

  const saveResourceUpdate = async () => {
    if (!editingResource) return;

    const trimmedLocation = editLocation.trim();
    const payload = {};

    if (trimmedLocation !== currentLocationValue) {
      if (!trimmedLocation) {
        setEditError("Location is required.");
        return;
      }
      payload.location = trimmedLocation;
    }

    if (editCapacity !== currentCapacityValue) {
      if (editCapacity.trim() === "") {
        setEditError("Capacity cannot be empty when changing it.");
        return;
      }

      const parsedCapacity = Number(editCapacity);
      if (!Number.isFinite(parsedCapacity) || parsedCapacity < 0) {
        setEditError("Capacity must be a valid positive number.");
        return;
      }

      payload.capacity = parsedCapacity;
    }

    if (Object.keys(payload).length === 0) {
      closeEditModal(true);
      return;
    }

    setIsSaving(true);
    setEditError("");

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(
        `${apiBaseUrl}/api/facilities/updateResource/${editingResource.id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        },
      );

      const payloadResponse = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(getMessage(payloadResponse));
      }

      setResources((current) =>
        current.map((resource) =>
          resource.id === editingResource.id ? payloadResponse : resource,
        ),
      );
      closeEditModal(true);
    } catch (requestError) {
      setEditError(
        requestError.message || "Unable to update the resource right now.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingResource) return;

    setIsDeleting(true);
    setDeleteError("");
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(
        `${apiBaseUrl}/api/facilities/deleteResource/${deletingResource.id}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(getMessage(payload));
      }

      setResources((current) =>
        current.filter((resource) => resource.id !== deletingResource.id),
      );
      setDeletingResource(null);
    } catch (requestError) {
      setDeleteError(
        requestError.message || "Unable to delete the resource right now.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="resource-management-shell">
      <div className="workspace-header">
        <div className="workspace-title-block">
          <h2>Resource Management</h2>
        </div>
        <button
          className="workspace-add-button resource-management-add-button"
          onClick={() => setIsCreateModalOpen(true)}
          type="button"
        >
          <span className="resource-management-add-icon">
            <PlusSquareIcon />
          </span>
          <span>Add Resource</span>
        </button>
      </div>

      <div className="resource-management-toolbar">
        <label
          className="workspace-search resource-management-search"
          htmlFor="resource-management-search"
        >
          <SearchIcon />
          <input
            id="resource-management-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by resource name or ID..."
            type="search"
            value={query}
          />
        </label>

        <label className="resource-management-filter">
          <span>Type</span>
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            <option value="">All Types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="resource-management-filter resource-management-filter-sm">
          <span>Min Capacity</span>
          <input
            inputMode="numeric"
            onChange={(event) => setMinCapacity(event.target.value)}
            placeholder="Min"
            type="number"
            value={minCapacity}
          />
        </label>

        <label className="resource-management-filter resource-management-filter-sm">
          <span>Max Capacity</span>
          <input
            inputMode="numeric"
            onChange={(event) => setMaxCapacity(event.target.value)}
            placeholder="Max"
            type="number"
            value={maxCapacity}
          />
        </label>

        <label className="resource-management-checkbox">
          <input
            checked={availableOnly}
            onChange={(event) => setAvailableOnly(event.target.checked)}
            type="checkbox"
          />
          <span>Available Only</span>
        </label>
      </div>

      {loading ? (
        <div className="resources-state-card">
          <div className="resources-loading-dots">
            <span />
            <span />
            <span />
          </div>
          <strong>Loading resource table...</strong>
          <span>Fetching the latest campus resource records.</span>
        </div>
      ) : error ? (
        <div className="resources-state-card resources-state-error">
          <strong>Could not load resources</strong>
          <span>{error}</span>
        </div>
      ) : (
        <div className="resource-management-table-wrap">
          <table className="resource-management-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Name</th>
                <th>Capacity</th>
                <th>Location</th>
                <th>Availability</th>
                <th>Update</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.length === 0 ? (
                <tr>
                  <td className="resource-management-empty-row" colSpan={8}>
                    No resources matched the current search or filters.
                  </td>
                </tr>
              ) : (
                filteredResources.map((resource) => (
                  <tr
                    key={resource.id ?? `${resource.name}-${resource.location}`}
                  >
                    <td>{resource.id ?? "N/A"}</td>
                    <td>{resource.type || "N/A"}</td>
                    <td>{resource.name || "N/A"}</td>
                    <td>{resource.capacity ?? "N/A"}</td>
                    <td>{resource.location || "N/A"}</td>
                    <td>
                      <div className="resource-management-availability-cell">
                        <select
                          className="resource-management-select"
                          onChange={(event) =>
                            requestAvailabilityChange(
                              resource,
                              event.target.value,
                            )
                          }
                          value={getAvailabilitySelectValue(resource)}
                        >
                          <option value="unknown" disabled>
                            Unknown
                          </option>
                          <option value="available">Available</option>
                          <option value="not-available">Not Available</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <button
                        className="resource-management-action resource-management-action-update"
                        onClick={() => openEditModal(resource)}
                        type="button"
                      >
                        Update
                      </button>
                    </td>
                    <td>
                      <button
                        className="resource-management-action resource-management-action-delete"
                        onClick={() => setDeletingResource(resource)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingResource ? (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-update-title"
          >
            <button
              className="modal-close"
              onClick={() => closeEditModal()}
              type="button"
            >
              <span aria-hidden="true">x</span>
            </button>

            <div className="modal-header">
              <h3 id="resource-update-title">Update Resource</h3>
              <p>Update the editable resource details below.</p>
            </div>

            <div className="modal-form-grid">
              <label className="modal-field">
                <span>ID</span>
                <input readOnly type="text" value={editingResource.id ?? ""} />
              </label>
              <label className="modal-field">
                <span>Type</span>
                <input
                  readOnly
                  type="text"
                  value={editingResource.type || "N/A"}
                />
              </label>
              <label className="modal-field">
                <span>Name</span>
                <input
                  readOnly
                  type="text"
                  value={editingResource.name || "N/A"}
                />
              </label>
              <label className="modal-field">
                <span>Capacity</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => setEditCapacity(event.target.value)}
                  placeholder="Capacity"
                  type="number"
                  value={editCapacity}
                />
              </label>
              <label className="modal-field modal-field-full">
                <span>Location</span>
                <input
                  onChange={(event) => setEditLocation(event.target.value)}
                  placeholder="Location"
                  type="text"
                  value={editLocation}
                />
              </label>
            </div>

            {editError ? (
              <div className="modal-inline-error">{editError}</div>
            ) : null}

            <div className="modal-actions">
              <button
                className="modal-secondary-button"
                onClick={() => closeEditModal(true)}
                type="button"
              >
                Discard
              </button>
              <button
                className="modal-primary-button"
                disabled={isSaving}
                onClick={saveResourceUpdate}
                type="button"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>

            {isCloseConfirmOpen ? (
              <div className="modal-confirm-strip">
                <strong>Unsaved changes</strong>
                <span>Do you want to save before closing this window?</span>
                <div className="modal-confirm-actions">
                  <button
                    className="modal-secondary-button"
                    onClick={() => setIsCloseConfirmOpen(false)}
                    type="button"
                  >
                    Continue Editing
                  </button>
                  <button
                    className="modal-secondary-button"
                    onClick={() => closeEditModal(true)}
                    type="button"
                  >
                    Discard
                  </button>
                  <button
                    className="modal-primary-button"
                    disabled={isSaving}
                    onClick={saveResourceUpdate}
                    type="button"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {deletingResource ? (
        <div className="modal-backdrop">
          <div
            className="modal-card modal-card-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-delete-title"
          >
            <div className="modal-header">
              <h3 id="resource-delete-title">Delete Resource</h3>
              <p>
                {deleteError
                  ? "This resource having current booking, so cancel them first and try to delete the resource."
                  : `Are you sure you want to delete ${deletingResource.name || "this resource"}?`}
              </p>
            </div>
            {deleteError ? (
              <div className="modal-actions">
                <button
                  className="modal-primary-button"
                  onClick={() => {
                    setDeletingResource(null);
                    setDeleteError("");
                  }}
                  type="button"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="modal-actions">
                <button
                  className="modal-secondary-button"
                  onClick={() => {
                    setDeletingResource(null);
                    setDeleteError("");
                  }}
                  type="button"
                >
                  No
                </button>
                <button
                  className="resource-management-action resource-management-action-delete"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  type="button"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {pendingAvailabilityChange ? (
        <div className="modal-backdrop">
          <div
            aria-labelledby="resource-availability-title"
            aria-modal="true"
            className="modal-card modal-card-confirm"
            role="dialog"
          >
            <div className="modal-header">
              <h3 id="resource-availability-title">Change Availability</h3>
              <p>
                Are you sure you want to mark{" "}
                {pendingAvailabilityChange.resource.name || "this resource"} as{" "}
                {pendingAvailabilityChange.nextValue === "available"
                  ? "Available"
                  : "Not Available"}
                ?
              </p>
            </div>

            {availabilityError ? (
              <div className="modal-inline-error">{availabilityError}</div>
            ) : null}

            <div className="modal-actions">
              <button
                className="modal-secondary-button"
                onClick={() => {
                  setPendingAvailabilityChange(null);
                  setAvailabilityError("");
                }}
                type="button"
              >
                No
              </button>
              <button
                className="modal-primary-button"
                disabled={isChangingAvailability}
                onClick={confirmAvailabilityChange}
                type="button"
              >
                {isChangingAvailability ? "Updating..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div className="modal-backdrop">
          <div
            aria-labelledby="resource-create-title"
            aria-modal="true"
            className="modal-card"
            role="dialog"
          >
            <button
              className="modal-close"
              onClick={closeCreateModal}
              type="button"
            >
              <span aria-hidden="true">x</span>
            </button>

            <div className="modal-header">
              <h3 id="resource-create-title">Create Resource</h3>
              <p>Add a new campus resource to the catalog.</p>
            </div>

            <div className="modal-form-grid">
              <label className="modal-field">
                <span>Type</span>
                <select
                  onChange={(event) => setCreateType(event.target.value)}
                  value={createType}
                >
                  <option value="">Select type</option>
                  <option value="LecHall">Lecture Hall</option>
                  <option value="Lab">Lab</option>
                  <option value="Item">Item</option>
                </select>
              </label>
              <label className="modal-field">
                <span>Name</span>
                <input
                  onChange={(event) => setCreateName(event.target.value)}
                  placeholder="E302"
                  type="text"
                  value={createName}
                />
              </label>
              <label className="modal-field">
                <span>Capacity</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => setCreateCapacity(event.target.value)}
                  placeholder="45"
                  type="number"
                  value={createCapacity}
                />
              </label>
              <label className="modal-field modal-field-full">
                <span>Location</span>
                <input
                  onChange={(event) => setCreateLocation(event.target.value)}
                  placeholder="FOC New Building"
                  type="text"
                  value={createLocation}
                />
              </label>
            </div>

            {createError ? (
              <div className="modal-inline-error">{createError}</div>
            ) : null}

            <div className="modal-actions">
              <button
                className="modal-secondary-button"
                onClick={closeCreateModal}
                type="button"
              >
                Discard
              </button>
              <button
                className="modal-primary-button"
                disabled={isCreating}
                onClick={saveCreatedResource}
                type="button"
              >
                {isCreating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
