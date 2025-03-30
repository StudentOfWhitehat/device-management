import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"
import type { DiagnosticResult } from "@/lib/types"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DiagnosticHistoryProps {
  diagnostics: DiagnosticResult[]
}

export default function DiagnosticHistory({ diagnostics }: DiagnosticHistoryProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Passed
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-500">
            <AlertCircle className="h-3 w-3 mr-1" /> Failed
          </Badge>
        )
      case "warning":
        return (
          <Badge className="bg-yellow-500">
            <AlertCircle className="h-3 w-3 mr-1" /> Warning
          </Badge>
        )
      case "running":
        return (
          <Badge className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" /> Running
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

  if (diagnostics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diagnostic History</CardTitle>
          <CardDescription>No diagnostic tests have been run yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            Run a diagnostic test to check the health of your device.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnostic History</CardTitle>
        <CardDescription>History of all diagnostic tests run on this device</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {diagnostics
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((diagnostic, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-medium">Diagnostic #{diagnostics.length - index}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(diagnostic.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {diagnostic.runBy && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={`https://avatar.vercel.sh/${diagnostic.runBy.id}.png`} />
                                <AvatarFallback>{diagnostic.runBy.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Run by: {diagnostic.runBy.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {getStatusBadge(diagnostic.status)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-medium">Overall Health</h4>
                      <span className="text-sm">{diagnostic.healthScore}%</span>
                    </div>
                    <Progress value={diagnostic.healthScore} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Test Results</h4>
                    <div className="space-y-2">
                      {diagnostic.tests.map((test, i) => (
                        <div key={i} className="bg-muted p-3 rounded-md">
                          <div className="flex justify-between items-center">
                            <h5 className="font-medium">{test.name}</h5>
                            {getStatusBadge(test.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                          {test.details && (
                            <div className="mt-2 text-sm bg-background p-2 rounded border">
                              <pre className="whitespace-pre-wrap">{test.details}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}

