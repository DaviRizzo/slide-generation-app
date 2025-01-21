import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const presentations = [
  {
    id: 1,
    title: "Apresentação Ciências",
    image: "/placeholder.svg",
    href: "/preview",
  },
  {
    id: 2,
    title: "Pitch para Investidores - Resultados",
    image: "/placeholder.svg",
    href: "/preview",
  },
  {
    id: 3,
    title: "Call de Resultados Trabalho de Campo",
    image: "/placeholder.svg",
    href: "/preview",
  },
  {
    id: 4,
    title: "Trabalho de Final de Ano",
    image: "/placeholder.svg",
    href: "/preview",
  },
  {
    id: 5,
    title: "Onboarding de Novos Funcionários",
    image: "/placeholder.svg",
    href: "/preview",
  },
  {
    id: 6,
    title: "Pesquisa sobre Genética UFAM",
    image: "/placeholder.svg",
    href: "/preview",
  },
  {
    id: 7,
    title: "Carta de Amor",
    image: "/placeholder.svg",
    href: "/preview",
  },
]

export function PresentationGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Link href="/">
        <Card className="h-full p-6 flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-accent transition-colors">
          <Plus className="h-12 w-12 mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">Crie uma nova apresentação</p>
        </Card>
      </Link>

      {presentations.map((presentation) => (
        <Link key={presentation.id} href={presentation.href}>
          <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all">
            <div className="aspect-video relative">
              <Image
                src={presentation.image || "/placeholder.svg"}
                alt={presentation.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium leading-none truncate">{presentation.title}</h3>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}

