export type UserDetails = {
	publicKey: string
	dataLimit: number
	dataUsed: number
	fileCount: number
	email: string
	network: string
	createdAt: number
	updatedAt: number
}

export type UserAuthDetails = {
	id: string
	keyName: string
	publicKey: string
	apiKey: string
	keyPrefix: string
	scope: string
	lastUpdate: number
}
