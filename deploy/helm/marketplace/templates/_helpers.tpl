{{- define "marketplace.labels" -}}
app.kubernetes.io/name: marketplace
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{- end }}

{{- define "marketplace.selectorLabels" -}}
app.kubernetes.io/name: marketplace
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "marketplace.secretName" -}}
{{- .Values.secret.name -}}
{{- end }}
