# Discord Leveling Bot - Python Implementation
# Using discord.py v2.0+ and JSON storage

import discord
from discord.ext import commands
import json
import os
import asyncio
import time
import random
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Bot configuration
intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(command_prefix='!', intents=intents)

# Configuration
CONFIG = {
    'XP_MIN': 15,
    'XP_MAX': 25,
    'COOLDOWN': 60,  # seconds
    'LEVEL_MULTIPLIER': 100
}

# Data file
DATA_FILE = 'users.json'

# Load user data
def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {}

# Save user data
def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

# Initialize data
user_data = load_data()

# Calculate XP needed for next level
def get_xp_for_level(level):
    return CONFIG['LEVEL_MULTIPLIER'] * (level ** 2)

# Get user key
def get_user_key(user_id, guild_id):
    return f"{guild_id}_{user_id}"

# Get user data
def get_user(user_id, guild_id):
    key = get_user_key(user_id, guild_id)
    if key not in user_data:
        user_data[key] = {
            'xp': 0,
            'level': 1,
            'last_message': 0
        }
    return user_data[key]

# Add XP to user
async def add_xp(message):
    user_id = message.author.id
    guild_id = message.guild.id
    now = time.time()
    
    user = get_user(user_id, guild_id)
    
    # Check cooldown
    if (now - user['last_message']) < CONFIG['COOLDOWN']:
        return
    
    # Add random XP
    xp_gain = random.randint(CONFIG['XP_MIN'], CONFIG['XP_MAX'])
    user['xp'] += xp_gain
    
    # Check for level up
    xp_needed = get_xp_for_level(user['level'])
    if user['xp'] >= xp_needed:
        user['level'] += 1
        user['xp'] = user['xp'] - xp_needed  # Carry over excess XP
        
        # Send level up message
        embed = discord.Embed(
            title='🎉 Level Up!',
            description=f"Congratulations {message.author.mention}! You've reached **Level {user['level']}**!",
            color=discord.Color.gold()
        )
        embed.add_field(
            name='Current XP',
            value=f"{user['xp']}/{get_xp_for_level(user['level'])}",
            inline=True
        )
        embed.timestamp = datetime.utcnow()
        
        await message.channel.send(embed=embed)
    
    # Update last message time
    user['last_message'] = now
    
    # Save data
    save_data(user_data)

# Bot ready event
@bot.event
async def on_ready():
    print(f'✅ Bot is online as {bot.user}')
    print(f'📊 Serving {len(bot.guilds)} servers')
    await bot.change_presence(activity=discord.Activity(
        type=discord.ActivityType.watching,
        name='members level up!'
    ))

# Message event for XP gain
@bot.event
async def on_message(message):
    # Ignore bots and DMs
    if message.author.bot or not message.guild:
        return
    
    # Add XP
    await add_xp(message)
    
    # Process commands
    await bot.process_commands(message)

# Rank command
@bot.command(name='rank')
async def rank(ctx, member: discord.Member = None):
    """View your rank card or another user's rank"""
    target = member or ctx.author
    user = get_user(target.id, ctx.guild.id)
    
    if user['level'] == 1 and user['xp'] == 0:
        await ctx.reply(f"{target.display_name} hasn't earned any XP yet!")
        return
    
    xp_needed = get_xp_for_level(user['level'])
    progress = int((user['xp'] / xp_needed) * 100)
    
    embed = discord.Embed(
        title='📊 Rank Card',
        color=discord.Color.blue()
    )
    embed.set_author(name=target.display_name, icon_url=target.display_avatar.url)
    embed.add_field(name='Level', value=str(user['level']), inline=True)
    embed.add_field(name='XP', value=f"{user['xp']}/{xp_needed}", inline=True)
    embed.add_field(name='Progress', value=f"{progress}%", inline=True)
    embed.timestamp = datetime.utcnow()
    
    await ctx.reply(embed=embed)

# Leaderboard command
@bot.command(name='leaderboard', aliases=['lb'])
async def leaderboard(ctx):
    """View the server leaderboard"""
    # Filter users for this guild and sort
    guild_users = []
    for key, data in user_data.items():
        if key.startswith(f"{ctx.guild.id}_"):
            user_id = int(key.split('_')[1])
            guild_users.append((user_id, data['level'], data['xp']))
    
    # Sort by level (desc), then XP (desc)
    guild_users.sort(key=lambda x: (x[1], x[2]), reverse=True)
    
    if not guild_users:
        await ctx.reply('No users on the leaderboard yet!')
        return
    
    # Build leaderboard embed
    description = ''
    for i, (user_id, level, xp) in enumerate(guild_users[:10]):
        try:
            user = await bot.fetch_user(user_id)
            username = user.name
        except:
            username = 'Unknown User'
        
        medal = '🥇' if i == 0 else '🥈' if i == 1 else '🥉' if i == 2 else f'{i + 1}.'
        description += f"{medal} **{username}** - Level {level} ({xp} XP)\n"
    
    embed = discord.Embed(
        title='🏆 Server Leaderboard',
        description=description,
        color=discord.Color.gold()
    )
    embed.set_footer(text=ctx.guild.name)
    embed.timestamp = datetime.utcnow()
    
    await ctx.reply(embed=embed)

# Level command
@bot.command(name='level')
async def level(ctx):
    """Check your current level and XP"""
    user = get_user(ctx.author.id, ctx.guild.id)
    
    if user['level'] == 1 and user['xp'] == 0:
        await ctx.reply("You haven't earned any XP yet! Start chatting to gain XP!")
        return
    
    xp_needed = get_xp_for_level(user['level'])
    await ctx.reply(f"You are **Level {user['level']}** with **{user['xp']}/{xp_needed} XP**!")

# Set XP command (Admin only)
@bot.command(name='setxp')
@commands.has_permissions(administrator=True)
async def setxp(ctx, member: discord.Member, amount: int):
    """Set a user's XP (Admin only)"""
    user = get_user(member.id, ctx.guild.id)
    user['xp'] = max(0, amount)
    save_data(user_data)
    await ctx.reply(f"Set {member.display_name}'s XP to {amount}!")

# Reset XP command (Admin only)
@bot.command(name='resetxp')
@commands.has_permissions(administrator=True)
async def resetxp(ctx, member: discord.Member):
    """Reset a user's XP (Admin only)"""
    user = get_user(member.id, ctx.guild.id)
    user['xp'] = 0
    user['level'] = 1
    save_data(user_data)
    await ctx.reply(f"Reset {member.display_name}'s XP and level!")

# Error handling
@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.MissingPermissions):
        await ctx.reply('❌ You do not have permission to use this command!')
    elif isinstance(error, commands.MemberNotFound):
        await ctx.reply('❌ Member not found!')
    elif isinstance(error, commands.BadArgument):
        await ctx.reply('❌ Invalid argument! Please check the command usage.')
    else:
        print(f'Error: {error}')

# Run the bot
if __name__ == '__main__':
    token = os.getenv('DISCORD_TOKEN')
    if not token:
        print('❌ Error: DISCORD_TOKEN not found in environment variables!')
        exit(1)
    
    bot.run(token)
