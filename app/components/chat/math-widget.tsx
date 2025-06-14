"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calculator, Function, ChartLine, MathOperations } from "@phosphor-icons/react"
import { useState, useEffect } from "react"
import { logTool, logUI, logAPI } from "@/lib/utils/logger"

interface MathWidgetProps {
  result: any
  parameters: any
  toolName: string
}

export function MathWidget({ result, parameters, toolName }: MathWidgetProps) {
  const [expression, setExpression] = useState(parameters?.expression || parameters?.equation || "")
  const [isCalculating, setIsCalculating] = useState(false)

  useEffect(() => {
    logTool('MATH_WIDGET_MOUNTED', { toolName, parameters, result })
  }, [])

  const handleCalculate = async () => {
    logUI('MATH_CALCULATE_STARTED', { expression, toolName })
    setIsCalculating(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsCalculating(false)
    logUI('MATH_CALCULATE_COMPLETED', { expression, toolName })
  }

  const insertFunction = (func: string) => {
    logUI('MATH_FUNCTION_INSERTED', { function: func, toolName })
    setExpression((prev: string) => prev + func)
  }

  const commonFunctions = [
    { label: "sin(x)", value: "sin(" },
    { label: "cos(x)", value: "cos(" },
    { label: "tan(x)", value: "tan(" },
    { label: "log(x)", value: "log(" },
    { label: "√x", value: "sqrt(" },
    { label: "x²", value: "^2" },
    { label: "π", value: "pi" },
    { label: "e", value: "e" }
  ]

  const examples = {
    basic: ["2 + 3 * 4", "15 / 3 - 2", "(8 + 2) * 5"],
    advanced: ["sin(pi/2)", "log(100)", "sqrt(16) + 2^3"],
    equations: ["x^2 - 4 = 0", "2x + 5 = 15", "3x - 7 = 2x + 1"]
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <MathOperations className="size-5" />
            Interactive Math Calculator
            <Badge variant="outline" className="ml-auto text-xs">
              {toolName}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calculator" className="text-xs">
                <Calculator className="size-4 mr-1" />
                Calculate
              </TabsTrigger>
              <TabsTrigger value="solve" className="text-xs">
                <Function className="size-4 mr-1" />
                Solve
              </TabsTrigger>
              <TabsTrigger value="graph" className="text-xs">
                <ChartLine className="size-4 mr-1" />
                Graph
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Input
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="Enter mathematical expression..."
                  className="text-lg font-mono"
                />
                
                {/* Function buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {commonFunctions.map((func) => (
                    <Button
                      key={func.label}
                      variant="outline"
                      size="sm"
                      onClick={() => insertFunction(func.value)}
                      className="text-xs"
                    >
                      {func.label}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleCalculate}
                  disabled={!expression || isCalculating}
                  className="w-full"
                >
                  {isCalculating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="size-4 mr-2" />
                      Calculate
                    </>
                  )}
                </Button>
              </div>

              {/* Examples */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-purple-700">Quick examples:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(examples).map(([category, exprs]) => (
                    <div key={category} className="space-y-1">
                      <div className="text-xs font-medium text-purple-600 capitalize">{category}:</div>
                      <div className="flex flex-wrap gap-1">
                        {exprs.map((expr) => (
                          <Button
                            key={expr}
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpression(expr)}
                            className="text-xs h-7 px-2 text-purple-700 hover:bg-purple-100"
                          >
                            {expr}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="solve" className="space-y-4 mt-4">
              <div className="text-center py-8 text-purple-600">
                <Function className="size-12 mx-auto mb-2" />
                <p>Equation solver interface</p>
                <p className="text-xs">Enter equations like "2x + 5 = 15"</p>
              </div>
            </TabsContent>

            <TabsContent value="graph" className="space-y-4 mt-4">
              <div className="text-center py-8 text-purple-600">
                <ChartLine className="size-12 mx-auto mb-2" />
                <p>Function graphing interface</p>
                <p className="text-xs">Visualize functions like "x^2 + 2x - 1"</p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Result Display */}
          {result && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="size-5 text-green-700" />
                <span className="font-medium text-green-800">Result:</span>
              </div>
              
              {result.value !== undefined && (
                <div className="text-2xl font-mono text-green-900 mb-2">
                  {result.expression || expression} = {result.value}
                </div>
              )}
              
              {result.steps && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-green-700 mb-2">Step-by-step solution:</div>
                  <div className="space-y-1">
                    {result.steps.map((step: string, index: number) => (
                      <div key={index} className="text-sm font-mono text-green-800 bg-white/50 rounded px-2 py-1">
                        {index + 1}. {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {result.explanation && (
                <div className="mt-3 text-sm text-green-800 bg-white/50 rounded p-2">
                  <strong>Explanation:</strong> {result.explanation}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}