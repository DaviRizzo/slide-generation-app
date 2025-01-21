import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GraduationCap, Users, Presentation, FileText, BarChart } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-start mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link href="/presentations" className="flex items-center gap-2">
              <Presentation className="h-4 w-4" />
              Minhas Apresentações
            </Link>
          </Button>
        </div>

        <h2 className="text-4xl font-bold text-center mb-8">Como posso ajudar?</h2>

        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Input placeholder="Peça sua apresentação" className="h-12 pl-4 pr-12 text-lg" />
            <Button size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" asChild>
              <Link href="/templates">
                <Presentation className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

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
      </div>
    </Layout>
  )
}

