"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GraduationCap, Users, Presentation, FileText, BarChart } from "lucide-react"
import Link from "next/link"
import { UserButton, useAuth } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [prompt, setPrompt] = useState("")

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      setShowAuthDialog(true)
      return
    }

    // Redireciona para a página de templates com o prompt como parâmetro
    router.push(`/templates?prompt=${encodeURIComponent(prompt)}`)
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Alinhar botão de apresentação e ícone do usuário */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link href="/presentations" className="flex items-center gap-2">
              <Presentation className="h-4 w-4" />
              Minhas Apresentações
            </Link>
          </Button>
          <div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        <h2 className="text-4xl font-bold text-center mb-8">Como posso ajudar?</h2>

        <form onSubmit={handlePromptSubmit} className="max-w-3xl mx-auto mb-12">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Digite o tema da sua apresentação..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button type="submit">
              Gerar Slides
            </Button>
          </div>
        </form>

        {/* Botões de categorias */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="outline" className="h-auto py-3 px-6">
            <GraduationCap className="mr-2 h-5 w-5" />
            Faculdade
          </Button>
          <Button variant="outline" className="h-auto py-3 px-6">
            <Users className="mr-2 h-5 w-5" />
            Reunião
          </Button>
          <Button variant="outline" className="h-auto py-3 px-6">
            <Presentation className="mr-2 h-5 w-5" />
            Palestras
          </Button>
          <Button variant="outline" className="h-auto py-3 px-6">
            <FileText className="mr-2 h-5 w-5" />
            Propostas
          </Button>
          <Button variant="outline" className="h-auto py-3 px-6">
            <BarChart className="mr-2 h-5 w-5" />
            Planejamentos
          </Button>
        </div>

        {/* Modal de autenticação */}
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="w-96 max-w-lg h-auto">
            <DialogHeader>
              <DialogTitle>Faça login para continuar</DialogTitle>
              <DialogDescription>
                Para gerar apresentações, você precisa ter uma conta. Faça login ou crie uma conta gratuitamente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/sign-in">Acessar conta</Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}