import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator
} from 'react-native'

import { EnvironmentButton } from '../components/EnvironmentButton'
import { Header } from '../components/Header'
import { PlantCardPrimary } from '../components/PlantCardPrimary'
import { Load } from '../components/Load'

import { api } from '../services/api'

import colors from '../styles/colors'
import fonts from '../styles/fonts'

interface EnvironmentState {
  key: string
  title: string
}

interface PlantState {
  id: number
  name: string
  about: string
  water_tips: string
  photo: string
  environments: string[]
  frequency: {
    times: number
    repeat_every: string
  }
}

export function PlantSelect() {
  const [environments, setEnvironments] = useState<EnvironmentState[]>([])
  const [plants, setPlants] = useState<PlantState[]>([])
  const [filteredPlants, setFilteredPlants] = useState<PlantState[]>([])
  const [environmentSelected, setEnvironmentSelected] = useState('all')
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadedAll, setLoadedAll] = useState(false)

  async function fetchPlants() {
    const { data } = await api
      .get<PlantState[]>('/plants', {
        params: {
          _sort: 'name',
          _order: 'asc',
          _page: page,
          _limit: 8
        }
      })

    if (!data) return setLoading(true)

    if (page > 1) {
      setPlants(oldValue => [...oldValue, ...data])
      setFilteredPlants(oldValue => [...oldValue, ...data])
    } else {
      setPlants(data)
      setFilteredPlants(data)
    }

    setLoading(false)
    setLoadingMore(false)
  }

  function handleEnvironmentSelected(environment: string) {
    setEnvironmentSelected(environment)

    if (environment === 'all') {
      return setFilteredPlants(plants)
    }

    const filtered = plants.filter(plant => plant.environments.includes(environment))

    setFilteredPlants(filtered)
  }

  function handleFetchMore(distance: number) {
      if(distance < 1) return;

      setLoadingMore(true)
      setPage(oldValue => oldValue + 1)
      fetchPlants()
  }

  useEffect(() => {
    async function fetchEnvironment() {
      const { data } = await api
        .get<EnvironmentState[]>('/plants_environments', {
          params: {
            _sort: 'title',
            _order: 'asc'
          }
        })

      setEnvironments([{ key: 'all', title: 'Todos' }, ...data])
    }

    fetchEnvironment()
  }, [])

  useEffect(() => {
    fetchPlants()
  }, [])

  if (loading) return <Load />

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Header />
        <Text style={styles.title}>Em qual ambiente</Text>
        <Text style={styles.subtitle}>você quer colocar sua planta?</Text>
      </View>

      <View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.environmentList}
          data={environments}
          keyExtractor={({ key }) => key}
          renderItem={({ item }) => (
            <EnvironmentButton
              title={item.title}
              active={item.key === environmentSelected}
              onPress={() => handleEnvironmentSelected(item.key)}
            />
          )}
        />
      </View>

      <View style={styles.plants}>
        <FlatList
          numColumns={2}
          showsVerticalScrollIndicator={false}
          data={filteredPlants}
          onEndReachedThreshold={0.1}
          onEndReached={({ distanceFromEnd }) => 
            handleFetchMore(distanceFromEnd)
          }
          keyExtractor={({ id }) => String(id)}
          renderItem={({ item }) => (
            <PlantCardPrimary
              data={{
                name: item.name,
                photo: item.photo
              }}
            />
          )}
          ListFooterComponent={
            loadingMore
            ? <ActivityIndicator color={colors.green} />
            : <></>
          }
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 17,
    color: colors.heading,
    fontFamily: fonts.heading,
    lineHeight: 20,
    marginTop: 15,
  },
  subtitle: {
    fontFamily: fonts.text,
    fontSize: 17,
    lineHeight: 20,
    color: colors.heading
  },
  environmentList: {
    height: 40,
    paddingBottom: 5,
    paddingLeft: 30,
    marginVertical: 32,
  },
  plants: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center'
  },
})
