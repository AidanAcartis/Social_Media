'use client'

import { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'

export default function ParametersPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Paramètres</h1>
      
      <Card>
        <h2 className="text-xl font-bold mb-4">Profil</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={user?.username || ''}
              className="w-full px-3 py-2 border rounded-md bg-gray-100"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              className="w-full px-3 py-2 border rounded-md bg-gray-100"
              disabled
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-4 text-red-600">Zone dangereuse</h2>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          onClick={() => alert('Fonctionnalité à venir')}
        >
          Supprimer mon compte
        </button>
      </Card>
    </div>
  )
}