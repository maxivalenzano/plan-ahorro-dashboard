import { NextResponse } from "next/server"

const PEUGEOT_API_BASE_URL = "https://www.peugeotplan.com.ar"

export async function POST(request: Request) {
  try {
    const { documentNumber, password, documentType, brand } = await request.json()

    const url = `${PEUGEOT_API_BASE_URL}/security/validateUser/${documentNumber}/${password}/${documentType}/${brand}`
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Cookie": "Cookie_bot=d5c55436e8e4d3206105930d69faca28"
      }
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error en la autenticación:", error)
    return NextResponse.json(
      { error: "Error en la autenticación" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 400 }
      )
    }

    const url = `${PEUGEOT_API_BASE_URL}/services/tuscuotas/content/3303/150`
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": token,
        "Accept": "application/json, text/plain, */*",
        "Cookie": "Cookie_bot=d5c55436e8e4d3206105930d69faca28"
      }
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al obtener datos del plan:", error)
    return NextResponse.json(
      { error: "Error al obtener datos del plan" },
      { status: 500 }
    )
  }
} 