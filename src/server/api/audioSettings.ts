import { redis } from '@devvit/web/server';

export async function getAudioSettingsHandler(request: any): Promise<Response> {
  try {
    const { userId }: { userId: string } = request.body;
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        soundEffectsEnabled: true,
        message: 'Invalid user ID' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const key = `chase-phrase:audio-settings:${userId}`;
    const settingsData = await redis.get(key);
    
    let settings = {
      soundEffectsEnabled: true
    };

    if (settingsData) {
      try {
        settings = JSON.parse(settingsData);
      } catch (error) {
        console.error('Error parsing audio settings:', error);
      }
    }

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('🎵 SERVER: Error in getAudioSettingsHandler:', error);
    return new Response(JSON.stringify({ 
      soundEffectsEnabled: true,
      message: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function saveAudioSettingsHandler(request: any): Promise<Response> {
  try {
    const { userId, soundEffectsEnabled }: { 
      userId: string; 
      soundEffectsEnabled: boolean; 
    } = request.body;
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid user ID' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const settings = {
      soundEffectsEnabled: soundEffectsEnabled ?? true
    };

    const key = `chase-phrase:audio-settings:${userId}`;
    await redis.set(key, JSON.stringify(settings));
    await redis.expire(key, 86400 * 30); // 30 days TTL

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Audio settings saved successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('🎵 SERVER: Error in saveAudioSettingsHandler:', error);
    return new Response(JSON.stringify({ 
      success: false,
      message: 'Failed to save audio settings' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
