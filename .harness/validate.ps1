$ErrorActionPreference = "Stop"

$harnessDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $harnessDirectory
$manifestPath = Join-Path $harnessDirectory "manifest.json"
$routesPath = Join-Path $harnessDirectory "routes.json"

$manifest = Get-Content -LiteralPath $manifestPath -Encoding utf8 -Raw | ConvertFrom-Json
$routes = Get-Content -LiteralPath $routesPath -Encoding utf8 -Raw | ConvertFrom-Json

$errors = [System.Collections.Generic.List[string]]::new()
$documentIds = @{}
$artifactIds = @{}
$routeIds = @{}
$orderedRouteIds = @{}
$routedDocumentIds = @{}

foreach ($document in $manifest.documents) {
  if ($documentIds.ContainsKey($document.id)) {
    $errors.Add("Duplicate document id: $($document.id)")
  } else {
    $documentIds[$document.id] = $document
  }

  $resolvedPath = Join-Path $projectRoot $document.path
  if (-not (Test-Path -LiteralPath $resolvedPath)) {
    $errors.Add("Document path does not exist: $($document.id) -> $($document.path)")
  }

  if ($document.status -eq "active" -and $document.authoritative_for.Count -eq 0) {
    $errors.Add("Active document has no authoritative_for: $($document.id)")
  }
}

foreach ($artifact in $manifest.artifacts) {
  if ($artifactIds.ContainsKey($artifact.id)) {
    $errors.Add("Duplicate artifact id: $($artifact.id)")
  } else {
    $artifactIds[$artifact.id] = $artifact
  }

  $resolvedPath = Join-Path $projectRoot $artifact.path
  if (-not (Test-Path -LiteralPath $resolvedPath)) {
    $errors.Add("Artifact path does not exist: $($artifact.id) -> $($artifact.path)")
  }
}

foreach ($document in $manifest.documents) {
  foreach ($dependencyId in $document.depends_on) {
    if (-not $documentIds.ContainsKey($dependencyId) -and -not $artifactIds.ContainsKey($dependencyId)) {
      $errors.Add("Document $($document.id) has unknown dependency: $dependencyId")
    }
  }

  foreach ($supersededId in $document.supersedes_in_scope) {
    if (-not $documentIds.ContainsKey($supersededId)) {
      $errors.Add("Document $($document.id) supersedes unknown document: $supersededId")
    }
  }
}

foreach ($route in $routes.routes) {
  if ($routeIds.ContainsKey($route.id)) {
    $errors.Add("Duplicate route id: $($route.id)")
  } else {
    $routeIds[$route.id] = $route
  }

  foreach ($required in $route.required) {
    if ($required.doc_id -and -not $documentIds.ContainsKey($required.doc_id)) {
      $errors.Add("Route $($route.id) references unknown document: $($required.doc_id)")
    } elseif ($required.doc_id) {
      $routedDocumentIds[$required.doc_id] = $true
    }
  }

  foreach ($conditional in $route.conditional) {
    if (
      $conditional.doc_id -and
      $conditional.doc_id -ne '$target_doc_id' -and
      -not $documentIds.ContainsKey($conditional.doc_id)
    ) {
      $errors.Add(
        "Route $($route.id) references unknown conditional document: $($conditional.doc_id)"
      )
    } elseif ($conditional.doc_id -and $conditional.doc_id -ne '$target_doc_id') {
      $routedDocumentIds[$conditional.doc_id] = $true
    }
  }

  foreach ($artifactReference in $route.artifacts) {
    if (
      $artifactReference.artifact_id -and
      -not $artifactIds.ContainsKey($artifactReference.artifact_id)
    ) {
      $errors.Add(
        "Route $($route.id) references unknown artifact: $($artifactReference.artifact_id)"
      )
    }
  }
}

foreach ($globalDocument in $routes.global_required) {
  if (-not $documentIds.ContainsKey($globalDocument.doc_id)) {
    $errors.Add("Global route references unknown document: $($globalDocument.doc_id)")
  } else {
    $routedDocumentIds[$globalDocument.doc_id] = $true
  }
}

foreach ($routeId in $routes.classification_order) {
  if (-not $routeIds.ContainsKey($routeId)) {
    $errors.Add("classification_order references unknown route: $routeId")
  }
  if ($orderedRouteIds.ContainsKey($routeId)) {
    $errors.Add("classification_order contains duplicate route: $routeId")
  } else {
    $orderedRouteIds[$routeId] = $true
  }
}

if ($routes.classification_order.Count -ne $routes.routes.Count) {
  $errors.Add("classification_order and routes have different counts")
}

foreach ($document in $manifest.documents) {
  if (
    $document.status -notin @("excluded", "deprecated") -and
    $document.authority -notin @("control", "record") -and
    -not $routedDocumentIds.ContainsKey($document.id)
  ) {
    $errors.Add("Document is not reachable from any route: $($document.id)")
  }
}

if ($errors.Count -gt 0) {
  Write-Error ("Harness validation failed:`n- " + ($errors -join "`n- "))
  exit 1
}

Write-Output (
  "Harness validation passed: {0} documents, {1} artifacts, {2} routes." -f
  $manifest.documents.Count,
  $manifest.artifacts.Count,
  $routes.routes.Count
)
