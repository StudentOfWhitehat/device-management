# Deployment Guide for Device Management System

This guide will help you deploy the Device Management System to Vercel.

## Prerequisites

1. A Supabase account
2. A Vercel account
3. Your project code

## Step 1: Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL script from `schema.sql` to create the necessary tables
4. Note your Supabase URL and API keys from the API settings page

## Step 2: Deploy to Vercel

1. Push your code to a GitHub repository
2. Log in to your Vercel account
3. Click "New Project" and import your GitHub repository
4. Configure the following environment variables:

