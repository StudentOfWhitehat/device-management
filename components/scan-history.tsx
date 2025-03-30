import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"
import type { ScanResult } from "@/lib/types"

interface ScanHistoryProps {
  scans: ScanResult[]
}

export default function ScanHistory({ scans }: ScanHistoryProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Healthy
          </Badge>
        )
      case "warning":
        return (
          <Badge className="bg-yellow-500">
            <AlertCircle className="h-3 w-3 mr-1" /> Warning
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-500">
            <AlertCircle className="h-3 w-3 mr-1" /> Error
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        )
      default:
        return (
          <Badge>
            <Clock className="h-3 w-3 mr-1" /> Unknown
          </Badge>
        )
    }
  }

  if (scans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
          <CardDescription>No scans have been performed yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">Run a scan to check for software errors and issues.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan History</CardTitle>
        <CardDescription>History of all device scans and detected issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {scans
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((scan, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-medium">Scan #{scans.length - index}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(scan.timestamp).toLocaleString()}</p>
                  </div>
                  {getStatusBadge(scan.status)}
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Issues Found ({scan.issues.length})</h4>
                  {scan.issues.length > 0 ? (
                    <ul className="space-y-2">
                      {scan.issues.map((issue, i) => (
                        <li key={i} className="text-sm bg-muted p-2 rounded">
                          <div className="flex items-start gap-2">
                            {issue.severity === "high" ? (
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                            ) : issue.severity === "medium" ? (
                              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                            )}
                            <div>
                              <p className="font-medium">{issue.name}</p>
                              <p className="text-muted-foreground">{issue.description}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No issues detected</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}

