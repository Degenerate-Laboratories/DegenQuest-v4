// colyseus
import { Client, Room } from "colyseus.js";
import { getServerUrl, isLocalEnvironment } from "../../shared/config/ServerHelper";
import { ServerMsg } from "../../shared/types";

export class Network {
    public _client: Client;

    constructor(port) {
        // For Colyseus, we need to make sure we're using the right protocol
        // In production, always use secure WebSocket (wss://)
        const isProduction = !isLocalEnvironment();
        
        // Get the appropriate WebSocket URL
        let wsUrl = getServerUrl('ws', true, port);
        
        // Log our connection settings
        console.log(`Initializing Colyseus client with URL: ${wsUrl} (isProduction: ${isProduction})`);
        
        // Create the Colyseus client
        this._client = new Client(wsUrl);
    }

    public async joinRoom(roomId, token, character_id): Promise<any> {
        try {
            console.log(`Joining room: ${roomId}`);
            return await this._client.joinById(roomId, {
                token: token,
                character_id: character_id,
            });
        } catch (error) {
            console.error(`Failed to join room ${roomId}:`, error);
            throw error;
        }
    }

    public async joinChatRoom(data): Promise<any> {
        try {
            console.log("Attempting to join chat room with data:", data);
            return await this._client.joinOrCreate("chat_room", data);
        } catch (error) {
            console.error("Failed to join chat room:", error);
            throw error;
        }
    }

    public async findCurrentRoom(currentRoomKey): Promise<any> {
        return new Promise(async (resolve: any, reject: any) => {
            try {
                let rooms = await this._client.getAvailableRooms("game_room");
                if (rooms.length > 0) {
                    rooms.forEach((room) => {
                        if (room.metadata.location === currentRoomKey) {
                            resolve(room);
                        }
                    });
                }
                resolve(false);
            } catch (error) {
                console.error("Error finding room:", error);
                resolve(false);
            }
        });
    }

    public async joinOrCreateRoom(location, token, character_id): Promise<any> {
        try {
            console.log(`Joining/creating room for location: ${location}`);
            
            // find all exisiting rooms
            let rooms = await this._client.getAvailableRooms("game_room");
            console.log(`Found ${rooms.length} existing game rooms`);

            // rooms exists
            if (rooms.length > 0) {
                // do we already have a room for the specified location
                let roomIdFound: boolean | string = false;
                rooms.forEach((room) => {
                    if (room.metadata.location === location) {
                        roomIdFound = room.roomId;
                        console.log(`Found existing room for location ${location}: ${roomIdFound}`);
                    }
                });

                // if so, let's join it
                if (roomIdFound !== false) {
                    return await this.joinRoom(roomIdFound, token, character_id);
                }
            }

            // else create a new room for that location
            console.log(`Creating new room for location: ${location}`);
            return await this._client.create("game_room", {
                location: location,
                token: token,
                character_id: character_id,
            });
        } catch (error) {
            console.error("Error joining/creating room:", error);
            throw error;
        }
    }
}
